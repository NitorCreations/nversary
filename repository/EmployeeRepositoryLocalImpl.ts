import { Employee } from "../domain/Employee";
import { Presence } from "../domain/Presence";
import { IEmployeeRepository } from "./EmployeeRepository";

class EmployeeRepositoryLocalImpl implements IEmployeeRepository {

  public data: any[];

  constructor(data: any[]) {
    this.data = data;
  }

  public findAllEmployees(): ReadonlyArray<Employee> {
    const people: any[] = (this.data as any).people;
    return people.map((p) => new Employee(p.fullName, p.email, p.presence.map(pres => new Presence(new Date(pres.start)))));
  }
}

export { EmployeeRepositoryLocalImpl };
