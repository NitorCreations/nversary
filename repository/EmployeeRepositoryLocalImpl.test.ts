import * as data from "../test/data/people.json";
import { EmployeeRepositoryLocalImpl } from "./EmployeeRepositoryLocalImpl";

it("returns employees", () => {
  const repo = new EmployeeRepositoryLocalImpl((data as any));
  const employees = repo.findAllEmployees();
  expect("Jösse Jalkanen").toEqual(employees[0].fullName);
  expect(new Date("2017-02-01T00:00:00.000Z")).toEqual(employees[0].presence[0].start);
  expect(undefined).toEqual(employees[0].profileImageUrl);
  
  expect("Hemppa Könönen").toEqual(employees[1].fullName);
  expect(new Date("2012-07-01T00:00:00.000Z")).toEqual(employees[1].presence[0].start);
  expect("https://example.com/image.jpg").toEqual(employees[1].profileImageUrl);
});
