import { CongratulationDay } from "../domain/CongratulationDay";
import {Employee} from "../domain/Employee";
import {Presence} from "../domain/Presence";
import {SlackConfiguration} from "../domain/SlackConfiguration";
import {SlackUser} from "../domain/SlackUser";
import {EmployeeRepositoryLocalImpl} from "../repository/EmployeeRepositoryLocalImpl";
import { AnniversaryService } from "./AnniversaryService";
import {CongratulationService} from "./CongratulationService";
import { SlackService } from "./SlackService";

const anniversaryService = new AnniversaryService(null);
const slackService = new SlackService(null);

const service = new CongratulationService(anniversaryService, slackService);

it("Sends message without tag", async () => {
  const now = new Date("2020-02-06");
  slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employeeToCongratulate1 = new Employee("Employee 1", "asd@asd.com",
    [new Presence(new Date("2018-02-06"))]);
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now);
  expect(slackService.scheduleMessage).toBeCalledWith("Congratulations *Employee 1* 2 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2018", now);
});

it("Sends message with tag", async () => {
  const now = new Date("2020-02-06");
  slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employeeToCongratulate1 = new Employee("Employee 1", "asd@asd.com",
    [new Presence(new Date("2018-02-06"))]);
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now);
  expect(slackService.scheduleMessage).toBeCalledWith("Congratulations *Employee 1* <@id> 2 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2018", now);
});

it("Sends 2 message if there are 2 persons to congratulate", async () => {
  const now = new Date("2020-02-06");
  slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
  slackService.scheduleMessage = jest.fn((message, contextMessage, now) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employeeToCongratulate1 = new Employee("Employee 1", "asd1@asd.com",
    [new Presence(new Date("2017-02-06"))]);
    congratulationDay.employeeToCongratulate2 = new Employee("Employee 2", "asd2@asd.com",
    [new Presence(new Date("2018-02-06"))]);
  anniversaryService.getEmployeesToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now);

  expect(slackService.scheduleMessage).toBeCalledWith("Congratulations *Employee 2* 2 years at Nitor! :tada:",
    "Employee 2 started at Nitor on 6.2.2018", now);
  expect(slackService.scheduleMessage).toBeCalledWith("Congratulations *Employee 1* 3 years at Nitor! :tada:",
    "Employee 1 started at Nitor on 6.2.2017", now);
});
