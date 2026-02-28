module "nversary_notifier" {
  source = "../../../modules/nversary_notifier"

  environment = "prod"
  runtime     = "nodejs24.x"
  timeout     = 300

  people_s3_bucket   = var.people_s3_bucket
  people_s3_key      = var.people_s3_key
  ssm_parameter_name = var.ssm_parameter_name
  artifact_file      = "${path.module}/../../../../build/prod/nversary.zip"

  log_retention_days = 30
}
