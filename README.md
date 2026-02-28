# nversary - work anniversary notifier

nversary congratulates people on their work anniversary in Slack.

## Functionality

Anniversary messages are sent on working days only, with a maximum of 3 messages per day. If there are more than 3 anniversaries on nearby dates, they are spread out so that people with longer tenure get the message closest to their actual anniversary day.

## Instructions

How to set up and configure nversary

### Build

To build the project run `serverless package` in the project directory.

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
- `appToken` is *Bot User OAuth Token* from *Features/OAuth & Permissions*.
- `channelId` is the identifier for channel where messages are sent. You can obtain this from Slack UI/Chat app.

### Serverless framework

nversary uses the Serverless Framework to deploy the Lambda function.

- Install serverless framework: <https://serverless.com/framework/docs/getting-started/>
- Current configuration in `serverless.yml` uses `nodejs14.x` runtime. Consider upgrading to a supported Node.js Lambda runtime before production use.

### Deploy to AWS

nversary is configured with environment variables and SSM parameters.

- `PEOPLE_S3_BUCKET` defines the S3 bucket within the same AWS account where people.json is stored.
- `PEOPLE_S3_KEY` defines the key for people.json inside the S3 bucket.
- `SSM_PARAMETER_NAME` defines SSM parameter name where Slack configuration is stored.

Deploying to dev

```shell
export PEOPLE_S3_BUCKET=my-bucket
export PEOPLE_S3_KEY=some/path/people.json
export SSM_PARAMETER_NAME=/nversary/config
sls deploy
```

Deploying to prod

```shell
export PEOPLE_S3_BUCKET=my-bucket
export PEOPLE_S3_KEY=some/path/people.json
export SSM_PARAMETER_NAME=/nversary/config-prod
sls deploy --stage prod
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

(Optional) Modify the interval of notifications

- `serverless.yml` contains the cron expression which defines when the code is executed.
