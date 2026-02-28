terraform {
  backend "s3" {
    bucket       = "nversary-terraform-state"
    key          = "dev/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true
  }
}
