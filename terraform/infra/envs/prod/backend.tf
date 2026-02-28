terraform {
  backend "s3" {
    bucket       = "nversary-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true
  }
}
