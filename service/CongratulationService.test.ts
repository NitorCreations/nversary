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
  slackService.sendMessage = jest.fn((message) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employeeToCongratulate = new Employee("Employee 1", "asd@asd.com",
    [new Presence(new Date("2018-02-06"))]);
  anniversaryService.getEmployeeToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now);
  expect(slackService.sendMessage).toBeCalledWith("Congratulations *Employee 1* 2 years at Nitor! :tada:");
});

it("Sends message with tag", async () => {
  const now = new Date("2020-02-06");
  slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
  slackService.sendMessage = jest.fn((message) => Promise.resolve());

  const congratulationDay = new CongratulationDay(now);
  congratulationDay.employeeToCongratulate = new Employee("Employee 1", "asd@asd.com",
    [new Presence(new Date("2018-02-06"))]);
  anniversaryService.getEmployeeToCongratulateToday = jest.fn((date: Date) => congratulationDay);

  await service.congratulate(now);
  expect(slackService.sendMessage).toBeCalledWith("Congratulations *Employee 1* <@id> 2 years at Nitor! :tada:");
});
