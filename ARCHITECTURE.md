# Architecture Overview

## What this project is
`nversary` is an AWS Lambda based Slack notifier that congratulates employees on their work anniversaries. It runs on a daily schedule, loads employee and Slack configuration data from AWS services, calculates who should be congratulated on that day, and schedules Slack messages.

## High-level runtime architecture

1. **Trigger layer**
- AWS EventBridge/CloudWatch schedule invokes Lambda function `handler.greeter` once per day (configured in `serverless.yml`).

2. **Ingress/config layer**
- Employee data is loaded from S3 (`PEOPLE_S3_BUCKET` + `PEOPLE_S3_KEY`).
- Slack credentials/channel config is loaded from SSM Parameter Store (`SSM_PARAMETER_NAME`).

3. **Domain/repository layer**
- `EmployeeRepositoryLocalImpl` maps raw JSON into domain entities (`Employee`, `Presence`).

4. **Application services layer**
- `AnniversaryService` computes which employees should be congratulated on each workday.
- `CongratulationService` builds message content, resolves Slack user tags by email, and determines exact send times for each message.

5. **Integration layer**
- `SlackService` calls Slack Web API:
  - `users.list` for user lookup
  - `chat.scheduleMessage` for posting scheduled messages

## Main execution flow

1. Lambda handler receives a scheduled event (or test event with optional `dateString` and `sendNow`).
2. Handler fetches people JSON from S3.
3. Handler fetches Slack config JSON from SSM (decrypted SecureString).
4. Handler constructs services (`AnniversaryService` + `CongratulationService` + `SlackService`).
5. `CongratulationService.congratulate(...)`:
- Computes today’s congratulation candidates (`maxPerDay = 3`).
- If no candidates, exits.
- For each employee selected for today:
  - Looks up Slack user mention by email.
  - Builds message + context.
  - Schedules message for one of three fixed UTC times.

## Anniversary scheduling logic

- Only weekdays (Mon-Fri) are considered congratulation days.
- Employees with anniversaries in the current month are candidates.
- First-year anniversaries are excluded (start year must be different from current year).
- Candidates are sorted by oldest start year first (longer tenure gets priority).
- Candidates are assigned to the closest available workday to their original anniversary date.
- Daily cap is `3` messages (bound to the three configured send times).

## Deployment/infrastructure

- Serverless Framework deploys one Lambda (`nversaryGreeter`) to AWS.
- IAM allows:
  - `ssm:GetParameter` on configured SSM path
  - `s3:GetObject` on configured people JSON object
- Runtime: Node.js (`serverless.yml` currently uses `nodejs14.x`).

## Code structure

- `handler.ts`: Lambda entry point and wiring
- `service/`: business logic and Slack API integration
- `repository/`: employee data access/mapping
- `domain/`: core entities and event/config types
- `test/` + `*.test.ts`: unit tests for scheduling, formatting, and repository mapping

## Key constraints and current technical debt

- Slack user lookup currently fetches full user list (no pagination support yet).
- Holiday/vacation calendar is not modeled; only weekend filtering exists.
- Notification send times are hardcoded in code.
- Lambda runtime in config is old (`nodejs14.x`) and likely should be upgraded.
- `webhookUrl` is present in config model but message sending currently uses bot token + Slack Web API.
