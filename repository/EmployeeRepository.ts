import { Employee } from "../domain/Employee";

interface IEmployeeRepository {
  findAllEmployees(): ReadonlyArray<Employee>;
}

export { IEmployeeRepository };
