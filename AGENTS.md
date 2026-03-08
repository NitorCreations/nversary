# Architecture Overview

## What this project is

`nversary` is an AWS Lambda application that sends work-anniversary congratulations to a Slack channel.

At runtime it:

- loads people data from S3
- loads Slack config from SSM Parameter Store
- calculates who should be congratulated on the current day
- schedules Slack messages via Slack Web API

## Runtime architecture

1. Trigger

- Production EventBridge rule invokes Lambda once per day using `cron(50 3 * * ? *)` (03:50 UTC).
- Development EventBridge rule is intentionally disabled with `cron(0 0 31 2 ? *)`.

2. Lambda entrypoint

- Handler: `handler.greeter`
- Reads deployment-time env vars:
    - `PEOPLE_S3_BUCKET`
    - `PEOPLE_S3_KEY`
    - `SSM_PARAMETER_NAME`

3. Data/config ingress

- People JSON is fetched from S3 object `s3://$PEOPLE_S3_BUCKET/$PEOPLE_S3_KEY`.
- Slack configuration is fetched from SSM `SecureString` parameter `$SSM_PARAMETER_NAME`.

4. Domain/repository/services

- `EmployeeRepositoryLocalImpl` maps JSON to `Employee` and `Presence` (including optional `slackId`).
- `AnniversaryService` computes monthly congratulation-day assignments.
- `CongratulationService` resolves mentions, formats messages, and chooses send times.
- `SlackService` calls Slack APIs.

5. External integration

- Slack `users.list` for mapping email -> Slack user id (fallback when `slackId` is missing in people data)
- Slack `chat.scheduleMessage` for scheduled post delivery

## Main execution flow

1. Lambda receives EventBridge event (or test event with `dateString` and `sendNow`).
2. Handler selects target date:

- `new Date(event.dateString)` when provided
- otherwise current date

3. Handler fetches people from S3 and config from SSM.
4. Handler constructs:

- `AnniversaryService(new EmployeeRepositoryLocalImpl(peopleData))`
- `SlackService(slackConfig)`
- `CongratulationService(anniversaryService, slackService)`

5. `CongratulationService.congratulate(date, sendNow)`:

- Builds 3 daily send slots (UTC): `11:40`, `07:50`, `09:45`
- Uses `maxPerDay = 3`
- Asks `AnniversaryService` for people assigned to this date
- For each selected employee:
    - uses direct mention from `employee.slackId` when available, otherwise resolves by email via Slack users API
    - builds message/context text
    - schedules Slack message (or near-immediate schedule when `sendNow=true`)

## Anniversary scheduling rules

- Only weekdays are valid congratulation days (`Mon-Fri`).
- Only employees whose start month equals current month are candidates.
- First-year anniversaries are excluded (`start year !== current year`).
- Candidates are sorted by start year ascending (longer tenure first).
- Each employee is assigned to the closest available workday to their anniversary date.
- Each day has at most `maxPerDay` slots (currently `3`).

## Message composition

- Base message:
    - `Congratulations *<fullName>* <optionalTag><years> year(s) at Nitor! :tada:`
- Context line includes start date, position, and business unit.
- Milestone extras:
    - `>= 5 years`: one palm tree
    - `>= 10 years`: two palm trees
    - extra achievement lines at exactly 5 and 10 years
- If employee has `profileImageUrl`, it is sent as a Slack block accessory image.

## Deployment architecture (current)

Deployment is Terraform-based (not Serverless Framework).

- Reusable module: `terraform/modules/nversary_notifier`
- Environment roots:
    - `terraform/infra/envs/dev`
    - `terraform/infra/envs/prod`
- Region: `eu-west-1`
- Lambda runtime: `nodejs24.x` (set in env roots)
- Lambda timeout: `300s`

Module provisions:

- IAM role + inline policy
    - `ssm:GetParameter` for configured parameter
    - `s3:GetObject` for configured people object
    - CloudWatch Logs permissions
- CloudWatch log group
- Lambda function
- EventBridge rule + target
- Lambda permission for EventBridge invocation

Terraform state:

- S3 backend bucket: `nversary-terraform-state`
- Bootstrapped from `terraform/remote-state`

## Build and packaging flow

`Taskfile.yml` is the deployment entrypoint:

- validates required env vars
- bootstraps Terraform remote state
- packages Lambda zip per env:
    - `build/dev/nversary.zip`
    - `build/prod/nversary.zip`
- runs `terraform init`, `plan`, and `apply`

Package build compiles TypeScript from:

- `handler.ts`
- `domain/**/*.ts`
- `repository/**/*.ts`
- `service/**/*.ts`

## Code layout

- `handler.ts`: Lambda orchestration and AWS fetches
- `domain/`: domain models and event/config types
- `repository/`: employee data mapping
- `service/`: anniversary logic, message formatting, Slack API client
- `terraform/`: infra module + env roots + remote-state bootstrap
- `test/` and `*.test.ts`: unit tests for scheduling, formatting, and repository behavior

## Known limitations / technical debt

- Slack user lookup uses `users.list` without cursor pagination.
- Mention resolution still loads full workspace user list (cached per invocation).
- Holiday/vacation calendars are not modeled; only weekends are skipped.
- Daily send times are hardcoded in `CongratulationService`.
- Slack config still includes `webhookUrl`, but runtime uses bot token + Web API methods.
- Several rate-limit mitigations are fixed sleeps (`setTimeout(1500)`), not adaptive backoff.
