import { CongratulationDay } from "../domain/CongratulationDay";
import { Employee } from "../domain/Employee";
import { Presence } from "../domain/Presence";
import { SlackUser } from "../domain/SlackUser";
import { AnniversaryService } from "./AnniversaryService";
import { CongratulationService } from "./CongratulationService";
import { SlackService } from "./SlackService";

const anniversaryService = new AnniversaryService(null);
const slackService = new SlackService(null);

const service = new CongratulationService(anniversaryService, slackService);

it("Sends message without tag", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.getUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Employee 1", "asd@asd.com", [new Presence(new Date("2018-02-06"))], "Senior Architect", "Software Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date, maxPerDay: number) => congratulationDay);

  await service.congratulate(now, false);
  const sendTime = new Date("2020-02-06T11:40:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 1* 2 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2018",
    "Employee 1 works as Senior Architect at Software Company Oy",
    sendTime);
});

it("Sends message with tag", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.getUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Employee 1", "asd@asd.com",
      [new Presence(new Date("2018-02-06"))], "Senior Architect", "Software Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, false);
  const sendTime = new Date("2020-02-06T11:40:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 1* <@id> 2 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2018",
    "Employee 1 works as Senior Architect at Software Company Oy",
    sendTime);
});

it("Sends 2 message if there are 2 persons to congratulate", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.getUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Employee 1", "asd1@asd.com",
      [new Presence(new Date("2017-02-06"))], "Senior Architect", "Software Company Oy"),
    new Employee("Employee 2", "asd2@asd.com",
      [new Presence(new Date("2018-02-06"))], "Junior Architect", "Other Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, false);

  const sendTime1 = new Date("2020-02-06T11:40:00Z")
  const sendTime2 = new Date("2020-02-06T07:50:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 2* 2 years at Nitor! :tada:",
    "Employee 2 started at Nitor on 6.2.2018",
    "Employee 2 works as Junior Architect at Other Company Oy",
    sendTime2);
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 1* 3 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2017",
    "Employee 1 works as Senior Architect at Software Company Oy",
    sendTime1);
});

it("Sends messages immediately if sendImmediately=true", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.getUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Employee 1", "asd1@asd.com",
      [new Presence(new Date("2017-02-06"))], "Senior Architect", "Software Company Oy"),
    new Employee("Employee 2", "asd2@asd.com",
      [new Presence(new Date("2018-02-06"))], "Junior Architect", "Other Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, true);

  const sendTime = new Date(Math.ceil(new Date().getTime() / 1000) * 1000 + 15000);

  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 2* 2 years at Nitor! :tada:",
    "Employee 2 started at Nitor on 6.2.2018",
    "Employee 2 works as Junior Architect at Other Company Oy",
    sendTime);
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Employee 1* 3 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2017",
    "Employee 1 works as Senior Architect at Software Company Oy",
    sendTime);
});
