# nversary  - work anniversary notifier
nversary congratulates people on their work anniversary in Slack

## Instructions
How to set up and configure nversary

### Build
To build the project run 'serverless package' in the project directory

### AWS Account
An AWS Account is required. If you don't have one, create it at https://aws.amazon.com/

### Slack

- Go to https://api.slack.com/apps and click Create New App, give your app a name and attach it to a workspace
- In Basic Configuration, from Add features and functionality, choose 'Incoming Webhooks' and turn the feature on from the switch
  - Click 'Add new Webhook to Workspace' and choose the channel you will be posting to
  - Copy the webhook url for later use
- In OAuth & Permissions, add three scopes: `chat:write`, `users:read`, `users:read.email` and `channels:read`
  - Save the Bot User OAuth Token
- Store credentials to AWS SSM Parameter Store, as SecureString
- Invite bot to channel: `/invite @botname`

The JSON in SSM Parameter Store looks similar to this:
```json
{
  "slack": {
    "webhookUrl": "https://hooks.slack.com/services/K2XSOISE/BJV2AO25W6X/lkfKssiXivpo0KawovOs",
    "appToken": "xoxb-32896343824-849329924324243-lkjrewrwXKhgkDkfobo4dore",
    "channelId": "JO3KFSO5"
  }
}
```
- `webhookUrl` is *Webhook URL* from *Features/Incoming Webhooks*.
- `appToken` is *Bot User OAuth Token* from *Features/OAuth & Permissions*.
- `channelId` is the identifier for channel where messages are sent. You can obtain this from Slack UI/Chat app. 


### Serverless framework
nversary uses serverless framework to deploy nversary
- Install serverless framework: https://serverless.com/framework/docs/getting-started/


### Deploy to AWS
nversary in configured with environment variables and SSM parameters.

- `PEOPLE_S3_BUCKET` defines the S3 bucket within the same AWS account where people.json is stored.
- `PEOPLE_S3_KEY` defines the key for people.json inside the S3 bucket.
- `SSM_PARAMETER_NAME` defines SSM parameter name where Slack configuration is stored.

```
export PEOPLE_S3_BUCKET=my-bucket
export PEOPLE_S3_KEY=some/path/people.json
export SSM_PARAMETER_NAME=/nversary/config
sls deploy
```

### Testing
You can test the Lambda function from AWS Lambda console by creating a test event with a `dateString` attribute. The date string should be in 'yyyy-MM-dd' format. Setting `sendNow` to true, will send messages
immediately.


(Optional) Modify the interval of notifications
* serverless.yml contains the cron expression which defines when the code is executed

# TODO
- incoming webhook is not needed? Sending happens via scheduleMessage method.
