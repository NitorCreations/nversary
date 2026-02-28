variable "people_s3_bucket" {
  description = "S3 bucket containing people JSON"
  type        = string
}

variable "people_s3_key" {
  description = "S3 object key for people JSON"
  type        = string
}

variable "ssm_parameter_name" {
  description = "SSM parameter name for Slack configuration"
  type        = string
}
