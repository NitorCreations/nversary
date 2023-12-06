import * as S3 from "aws-sdk/clients/s3";
import * as SSM from "aws-sdk/clients/ssm";
import { URL } from "url";
import { Callback, Context, Handler, ScheduledEvent } from "aws-lambda";
import { INversaryEvent } from "./domain/NversaryEvent";
import { SlackConfiguration } from "./domain/SlackConfiguration";
import { EmployeeRepositoryLocalImpl } from "./repository/EmployeeRepositoryLocalImpl";
import { AnniversaryService } from "./service/AnniversaryService";
import { CongratulationService } from "./service/CongratulationService";
import { SlackService } from "./service/SlackService";

interface Config {
  slack: SlackConfiguration;
}

/**
 * Fetch configuration from SSM parameters.
 */
const fetchConfig = async (parameterName: string): Promise<Config> => {
  console.info(`Fetch SSM parameter ${parameterName}`);
  const ssm = new SSM();
  return ssm
    .getParameter({ Name: parameterName, WithDecryption: true })
    .promise()
    .then((response) => JSON.parse(response.Parameter?.Value as string))
    .then((config) => ({
      slack: new SlackConfiguration(
        config.slack.webhookUrl as string,
        config.slack.channelId as string,
        config.slack.appToken as string,
        false
      ),
    }));
};

/**
 * Fetch people data from S3 bucket as a JSON.
 */
const fetchPeopleData = async (bucket: string, key: string): Promise<any> => {
  console.info(`Fetch S3 object s3://${bucket}/${key}`);
  const s3 = new S3();
  return s3
    .getObject({ Bucket: bucket, Key: key })
    .promise()
    .then((response: any) => JSON.parse(response.Body.toString("utf-8")));
};

export const greeter: Handler = async (
  event: INversaryEvent,
  context: Context,
  cb: Callback
) => {
  console.info("event: \n" + JSON.stringify(event, null, 2));

  const date = event.dateString ? new Date(event.dateString) : new Date();
  const peopleData = await fetchPeopleData(
    process.env["PEOPLE_S3_BUCKET"] as string,
    process.env["PEOPLE_S3_KEY"] as string
  );
  const config: Config = await fetchConfig(
    process.env["SSM_PARAMETER_NAME"] as string
  );

  const service = new CongratulationService(
    new AnniversaryService(new EmployeeRepositoryLocalImpl(peopleData)),
    new SlackService(config.slack)
  );

  await service.congratulate(date, event.sendNow);
};
