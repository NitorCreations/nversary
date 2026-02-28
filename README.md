# nversary - work anniversary notifier

nversary congratulates people on their work anniversary in Slack.

## Functionality

Anniversary messages are sent on working days only, with a maximum of 3 messages per day. If there are more than 3 anniversaries on nearby dates, they are spread out so that people with longer tenure get the message closest to their actual anniversary day.

## Instructions

How to set up and configure nversary

### Build

Build and package the Lambda artifact as a local zip file for Terraform to deploy.

### AWS Account

An AWS Account is required. If you don't have one, create it at <https://aws.amazon.com/>

### Slack

- Go to <https://api.slack.com/apps> and click Create New App, give your app a name and attach it to a workspace.
- In OAuth & Permissions, add bot token scopes:
    - `chat:write`
    - `users:read`
    - `users:read.email`
- Install the app to the workspace and save the Bot User OAuth Token.
- Invite bot to the target channel: `/invite @botname`
- Store credentials to AWS SSM Parameter Store as `SecureString`.

The JSON in SSM Parameter Store looks similar to this:

```json
{
    "slack": {
        "webhookUrl": "",
        "appToken": "xoxb-32896343824-849329924324243-lkjrewrwXKhgkDkfobo4dore",
        "channelId": "JO3KFSO5"
    }
}
```

- `webhookUrl` is currently unused by the runtime (kept for backward compatibility with the existing config model).
- `appToken` is _Bot User OAuth Token_ from _Features/OAuth & Permissions_.
- `channelId` is the identifier for channel where messages are sent. You can obtain this from Slack UI/Chat app.

### Deploy to AWS

nversary uses Terraform for deployment.

Terraform layout:

- `terraform/modules/nversary_notifier` reusable module
- `terraform/infra/envs/prod` production environment root

The production environment uses an S3 backend (`backend "s3" {}`) configured in `terraform/infra/envs/prod/backend.tf`.

Deployment values come from Terraform input variables and static values in `terraform/infra/envs/prod/main.tf`:

- `name` and `environment`
- `runtime` and `timeout`
- `people_s3_bucket` and `people_s3_key` (pass at apply/plan time)
- `ssm_parameter_name` (pass at apply/plan time)
- `artifact_file` (local path to the Lambda zip)
- `log_retention_days`

Deploying to prod:

```shell
cd terraform/infra/envs/prod
terraform init
terraform plan \
  -var="people_s3_bucket=$PEOPLE_S3_BUCKET" \
  -var="people_s3_key=$PEOPLE_S3_KEY" \
  -var="ssm_parameter_name=$SSM_PARAMETER_NAME"
terraform apply \
  -var="people_s3_bucket=$PEOPLE_S3_BUCKET" \
  -var="people_s3_key=$PEOPLE_S3_KEY" \
  -var="ssm_parameter_name=$SSM_PARAMETER_NAME"
```

### Unit testing

```shell
npm run test
```

### End to end testing

You can test the Lambda function from AWS Lambda console by creating a test event with a `dateString` attribute.
The date string should be in 'yyyy-MM-dd' format.
Setting `sendNow` to true, will send messages immediately. An example of test event:

```json
{
    "dateString": "2022-04-25",
    "sendNow": true
}
```
