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
    new Employee("Erkki Esimerkki", "asd@asd.com", [new Presence(new Date("2018-02-06"))], "Senior Architect", "Software Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date, maxPerDay: number) => congratulationDay);

  await service.congratulate(now, false);
  const sendTime = new Date("2020-02-06T11:40:00Z");
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Erkki Esimerkki* 2 years at Nitor! :tada:",
    ["Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy"],
    undefined,
    sendTime);
});

it("Sends message with tag", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.getUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Erkki Esimerkki", "asd@asd.com",
      [new Presence(new Date("2018-02-06"))], "Senior Architect", "Software Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, false);
  const sendTime = new Date("2020-02-06T11:40:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Erkki Esimerkki* <@id> 2 years at Nitor! :tada:",
    ["Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy"],
    undefined,
    sendTime);
});

it("Sends message with profileImageUrl", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.getUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Erkki Esimerkki", "asd@asd.com",
      [new Presence(new Date("2018-02-06"))], "Senior Architect", "Software Company Oy", "https://example.com/image.jpg")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, false);
  const sendTime = new Date("2020-02-06T11:40:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Erkki Esimerkki* <@id> 2 years at Nitor! :tada:",
    ["Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy"],
    "https://example.com/image.jpg",
    sendTime);
});

it("Sends 2 message if there are 2 persons to congratulate", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.getUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Erkki Esimerkki", "asd1@asd.com",
      [new Presence(new Date("2017-02-06"))], "Senior Architect", "Software Company Oy"),
    new Employee("Maija Mallikas", "asd2@asd.com",
      [new Presence(new Date("2018-02-06"))], "Junior Architect", "Other Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, false);

  const sendTime1 = new Date("2020-02-06T11:40:00Z")
  const sendTime2 = new Date("2020-02-06T07:50:00Z")
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Maija Mallikas* 2 years at Nitor! :tada:",
    ["Maija started at Nitor on 6.2.2018 and works now as Junior Architect at Other Company Oy"],
    undefined,
    sendTime2);
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Erkki Esimerkki* 3 years at Nitor! :tada:",
    ["Erkki started at Nitor on 6.2.2017 and works now as Senior Architect at Software Company Oy"],
    undefined,
    sendTime1);
});

it("Sends messages immediately if sendImmediately=true", async () => {
  const now = new Date("2020-02-06T03:30:00Z");
  //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.getUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employees = [
    new Employee("Erkki Esimerkki", "asd1@asd.com",
      [new Presence(new Date("2017-02-06"))], "Senior Architect", "Software Company Oy"),
    new Employee("Maija Mallikas", "asd2@asd.com",
      [new Presence(new Date("2018-02-06"))], "Junior Architect", "Other Company Oy")
  ];
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now, true);

  const sendTime = new Date(Math.ceil(new Date().getTime() / 1000) * 1000 + 10000);

  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Erkki Esimerkki* 3 years at Nitor! :tada:",
    ["Erkki started at Nitor on 6.2.2017 and works now as Senior Architect at Software Company Oy"],
    undefined,
    sendTime);
  expect(slackService.scheduleMessage).toBeCalledWith(
    "Congratulations *Maija Mallikas* 2 years at Nitor! :tada:",
    ["Maija started at Nitor on 6.2.2018 and works now as Junior Architect at Other Company Oy"],
    undefined,
    sendTime);
});
