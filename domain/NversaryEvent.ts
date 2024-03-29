import { ScheduledEvent } from "aws-lambda";

interface INversaryEvent extends ScheduledEvent {
  dateString : string;
  sendNow : true;
}

export { INversaryEvent };
