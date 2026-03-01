# nversary - work anniversary notifier

nversary congratulates people on their work anniversary in Slack.

## Functionality

Anniversary messages are sent on working days only, with a maximum of 3 messages per day. If there are more than 3 anniversaries on nearby dates, they are spread out so that people with longer tenure get the message closest to their actual anniversary day.

## Instructions

How to set up and configure nversary

### Build

Build and package the Lambda artifact as a local zip file for Terraform to deploy.

The artifact is created by Task at:

- `build/dev/nversary.zip`
- `build/prod/nversary.zip`

### AWS Account

An AWS Account is required. If you don't have one, create it at <https://aws.amazon.com/>

### People data (S3 object)

People data is read from `s3://$PEOPLE_S3_BUCKET/$PEOPLE_S3_KEY`.

Expected shape:

```json
{
  "people": [
    {
      "fullName": "Example Person",
      "email": "example.person@example.com",
      "presence": [{ "start": "2018-02-01" }],
      "position": "Senior Consultant",
      "businessUnit": "Technology",
      "profileImageUrl": "https://example.com/image.jpg",
      "slackId": "U0123456789"
    }
  ]
}
```

Notes:

- `slackId` is optional but recommended; when present, nversary mentions that Slack user directly.
- If `slackId` is missing, nversary falls back to matching Slack users by `email`.
- `profileImageUrl` is optional.

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
- `terraform/infra/envs/dev` development environment root
- `terraform/infra/envs/prod` production environment root
- `terraform/remote-state` bootstrap for Terraform backend state bucket

Both environments use an S3 backend (`backend "s3" {}`) configured in:

- `terraform/infra/envs/dev/backend.tf`
- `terraform/infra/envs/prod/backend.tf`

Deployment values come from Terraform input variables and static values in `terraform/infra/envs/*/main.tf`:

- `name` and `environment`
- `runtime` and `timeout`
- `people_s3_bucket` and `people_s3_key` (pass at apply/plan time)
- `ssm_parameter_name` (pass at apply/plan time)
- `artifact_file` (local path to the Lambda zip)
- `log_retention_days`

Current environment scheduling:

- `dev`: disabled schedule (`cron(0 0 31 2 ? *)`)
- `prod`: daily at `03:50 UTC` (`cron(50 3 * * ? *)`)

### Deployment prerequisites

Install:

- [Task](https://taskfile.dev/)
- Terraform (`>= 1.14.0`)
- Node.js + npm

Set required environment variables:

```shell
export PEOPLE_S3_BUCKET=your-people-bucket
export PEOPLE_S3_KEY=path/to/people.json
export SSM_PARAMETER_NAME=/path/to/slack-config
```

### Deploy with Task

Plan/apply for development:

```shell
task deploy:plan:dev
task deploy:dev
```

Plan/apply for production:

```shell
task deploy:plan:prod
task deploy:prod
```

Task workflow does all of the following:

- validates required environment variables
- bootstraps Terraform remote state from `terraform/remote-state/main.tf` if needed
- packages Lambda artifact zip for the selected environment
- runs Terraform `init`, `plan`, and `apply` in the matching environment root

### Unit testing

```shell
npm run test
```

### End to end testing

You can test the Lambda function from AWS Lambda console by creating a test event with a `dateString` attribute.
The date string should be in `yyyy-MM-dd` format.
Setting `sendNow` to true, will send messages immediately. An example of test event:

```json
{
    "dateString": "2022-04-25",
    "sendNow": true
}
```
