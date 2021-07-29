import { Presence } from "./Presence";

class Employee {
  public fullName: string;
  public email: string;
  public presence: Presence[];

  constructor(fullName: string, email: string, presence: Presence[]) {
    this.fullName = fullName;
    this.email = email;
    this.presence =  presence;
  }
}

export { Employee };
