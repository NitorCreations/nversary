import {Employee} from "../domain/Employee";
import {SlackConfiguration} from "../domain/SlackConfiguration";
import {EmployeeRepositoryLocalImpl} from "../repository/EmployeeRepositoryLocalImpl";
import {AnniversaryService} from "./AnniversaryService";
import {SlackService} from "./SlackService";

/**
 * Employees 1, 2 and 3 have started on the same date.
 * Employee 1 should be congratulated on the nearest date (based on start year)
 * 
 * 02-01 is saturday, 02-02 is sunday so first congratulation day is pushed to 02-03.
 * 
 * The result should be 
 * 
 * 02-01: -
 * 02-02: -
 * 02-03: Employee 1
 * 02-04: Employee 2
 * 02-05: Employee 4
 * 02:06: Employee 3
 * 
 */
const data = {
  people : [
    {
      fullName: "Employee 1",
      email: "employee.one@email.com",
      presence: [{start: "2016-02-01"}],
    },
    {
      fullName: "Employee 2",
      email: "employee.two@email.com",
      presence: [{start: "2017-02-01"}],
    },
    {
      fullName: "Employee 3",
      email: "employee.two@email.com",
      presence: [{start: "2019-02-01"}],
    },
    {
      fullName: "Employee 4",
      email: "employee.three@email.com",
      presence: [{start: "2018-02-02"}],
    },
  ],
};

const service = new AnniversaryService(
  new EmployeeRepositoryLocalImpl((data as any)));

it("It should not congratulate anyone on 2020-02-01 because it is Saturday", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-01T03:24:00"));
  expect(congratulationDay).toBeUndefined();
});

it("It should not congratulate anyone on 2020-02-01 because it is Sunday", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-02T03:24:00"));
  expect(congratulationDay).toBeUndefined();
});

it("It should congratulate Employee 1 on 2020-02-03 because it's closest to her starting date", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-03T03:24:00"));
  expect(congratulationDay.employeeToCongratulate.fullName).toBe("Employee 1");
});

it("It should congratulate Employee 2 on 2020-02-04 because 02-03 was taken by E. 1.", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-04T03:24:00"));
  expect(congratulationDay.employeeToCongratulate.fullName).toBe("Employee 2");
});

it("It should congratulate Employee 4 on 2020-02-05 he has worked longer than E. 3", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-05T03:24:00"));
  expect(congratulationDay.employeeToCongratulate.fullName).toBe("Employee 4");
});

it("It should congratulate Employee 3 on 2020-02-06", async () => {
  const congratulationDay = service.getEmployeeToCongratulateToday(new Date("2020-02-06T03:24:00"));
  expect(congratulationDay.employeeToCongratulate.fullName).toBe("Employee 3");
});
