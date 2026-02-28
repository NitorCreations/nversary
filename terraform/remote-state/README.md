# Terraform backend state bucket bootstrap

This deployment creates the S3 bucket used by the main Terraform backend:

- `nversary-terraform-state` (region `eu-west-1`)

## Usage

From this directory:

```bash
terraform init
terraform apply
```

After this has been applied successfully, you can run the main deployment in `terraform/infra/envs/prod`.

## If the bucket already exists

Terraform cannot conditionally create an already-existing unmanaged S3 bucket.
If the bucket exists, import it into this bootstrap state first:

```bash
terraform init
terraform import aws_s3_bucket.terraform_state nversary-terraform-state
terraform apply
```
