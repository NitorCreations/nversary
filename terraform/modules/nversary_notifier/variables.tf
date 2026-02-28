variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 300
}

variable "people_s3_bucket" {
  description = "Bucket containing people JSON"
  type        = string
}

variable "people_s3_key" {
  description = "Key for people JSON object"
  type        = string
}

variable "ssm_parameter_name" {
  description = "SSM parameter name for Slack config"
  type        = string
}

variable "artifact_file" {
  description = "Path to local Lambda deployment artifact zip file"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "schedule_expression" {
  description = "Schedule expression for Lambda invocation (e.g. cron or rate expression)"
  type        = string
}