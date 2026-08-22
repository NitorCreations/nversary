# nversary - work anniversary notifier

nversary congratulates people on their work anniversary in Slack.

## Functionality

Anniversary messages are sent on working days only, with a maximum of 3 messages per day. If there are more than 3 anniversaries on nearby dates, they are spread out so that people with longer tenure get the message closest to their actual anniversary day.

## Getting started

The full setup, in the order it needs to happen:

1. **Install tooling** — Task, Terraform (`>= 1.14.0`), Node.js + npm. See [Deployment prerequisites](#deployment-prerequisites).
2. **Configure AWS credentials** for an account in `eu-west-1`. See [AWS credentials](#aws-credentials).
3. **Create the S3 people-data object** with the employee JSON. See [People data (S3 object)](#people-data-s3-object).
4. **Create the SSM `SecureString` parameter** with the Slack config. See [Slack](#slack).
5. **Export the required environment variables** (`PEOPLE_S3_BUCKET`, `PEOPLE_S3_KEY`, `SSM_PARAMETER_NAME`). See [Environment variables](#environment-variables).
6. **Deploy** with `task deploy:plan:dev` to preview, then `task deploy:dev` to apply. See [Deploy with Task](#deploy-with-task).

Steps 1–2 and 5 are hard prerequisites for `terraform apply`; the S3 object and SSM parameter (steps 3–4) are only read by the Lambda at runtime, so deployment succeeds without them but the Lambda will fail until they exist.

## Instructions

How to set up and configure nversary

### AWS Account

An AWS Account is required. If you don't have one, create it at <https://aws.amazon.com/>

### AWS credentials

Terraform and the AWS CLI authenticate using the standard AWS credential chain (`~/.aws/credentials`, environment variables, or SSO) — nversary does not read any `AWS_*` variables of its own. The target region is hardcoded to `eu-west-1` in the Terraform providers and backends, so your default region does not matter, but your credentials must be valid for the account you want to deploy into.

The credentials need permissions to manage: S3 (the Terraform state bucket), IAM roles/policies, Lambda, CloudWatch Logs, and EventBridge.

Sign in with `aws configure` (or `aws sso login`) and verify with:

```shell
aws sts get-caller-identity
```

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
        "appToken": "xoxb-....",
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

### Slack dry-run by environment

Slack send behavior is controlled by the Lambda environment variable `SLACK_DRY_RUN`.

- `dev`: configurable at deploy time via `SLACK_DRY_RUN`, defaults to `true`
- `prod`: always `false` (messages are always sent)

Examples:

```shell
# dev default (dry-run enabled)
task deploy:dev

# dev override (send real Slack messages)
SLACK_DRY_RUN=false task deploy:dev

# prod (always dry-run=false)
task deploy:prod
```

### Deployment prerequisites

Install:

- [Task](https://taskfile.dev/)
- Terraform (`>= 1.14.0`)
- Node.js + npm

### Environment variables

Before running any deploy or plan command, export these variables. Task validates them in its `check-env` step and **aborts the deploy if any is missing**. The same three values are also injected as the Lambda's runtime environment variables.

```shell
# Required — validated by `task`; deploy aborts if any is unset
export PEOPLE_S3_BUCKET=your-people-bucket
export PEOPLE_S3_KEY=path/to/people.json
export SSM_PARAMETER_NAME=/path/to/slack-config

# Optional — dev only, defaults to true; prod always sends real messages
export SLACK_DRY_RUN=false
```

**Persist them so you don't have to remember next time.** Save the exports once to a local, git-ignored file (e.g. `.env.local`) and source it before deploying:

```shell
set -a; source .env.local; set +a
task deploy:plan:dev
```

Keep that file out of version control (it names your real bucket and parameter) — add it to `.gitignore`. If you use [direnv](https://direnv.net/), an `.envrc` with the same exports loads them automatically when you `cd` into the project. (Task can also auto-load a dotenv via a `dotenv:` directive in `Taskfile.yml` if you later want that built in.)

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
- packages the Lambda artifact zip for the selected environment (`build/dev/nversary.zip` or `build/prod/nversary.zip`)
- runs Terraform `init`, `plan`, and `apply` in the matching environment root

You do not need to build the artifact separately — packaging happens automatically as part of plan/apply.

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
