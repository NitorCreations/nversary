terraform {
  required_version = ">= 1.14.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

locals {
  name = "nversary-greeter"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    sid    = "AllowCreateLogGroup"
    effect = "Allow"

    actions = ["logs:CreateLogGroup"]

    resources = ["*"]
  }

  statement {
    sid    = "AllowReadSsmParameter"
    effect = "Allow"

    actions = ["ssm:GetParameter"]

    resources = [
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_name}"
    ]
  }

  statement {
    sid    = "AllowReadPeopleObject"
    effect = "Allow"

    actions = ["s3:GetObject"]

    resources = [
      "arn:aws:s3:::${var.people_s3_bucket}/${var.people_s3_key}"
    ]
  }

  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "${aws_cloudwatch_log_group.lambda.arn}:*"
    ]
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name}-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${local.name}-lambda-policy-${var.environment}"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.nversary_notifier.function_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "nversary_notifier" {
  function_name = "${local.name}-lambda-${var.environment}"
  description   = "Sends work anniversary greetings to Slack channel. Runs daily"
  role          = aws_iam_role.lambda.arn
  runtime       = var.runtime
  handler       = "handler.greeter"
  timeout       = var.timeout

  filename = var.artifact_file
  source_code_hash = filebase64sha256(var.artifact_file)

  environment {
    variables = {
      PEOPLE_S3_BUCKET   = var.people_s3_bucket
      PEOPLE_S3_KEY      = var.people_s3_key
      SSM_PARAMETER_NAME = var.ssm_parameter_name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda,
    aws_cloudwatch_log_group.lambda
  ]
}

resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "${local.name}-schedule-${var.environment}"
  description         = "Schedule for ${local.name} (${var.environment}) Lambda function"
  schedule_expression = var.schedule_expression
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "${local.name}-target-${var.environment}"
  arn       = aws_lambda_function.nversary_notifier.arn
}

resource "aws_lambda_permission" "allow_eventbridge_to_invoke_nversary_notifier" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nversary_notifier.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}
