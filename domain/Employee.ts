import { Presence } from "./Presence";

class Employee {
  public fullName: string;
  public email: string;
  public presence: Presence[];
  public position: string;
  public subcompany: string;

  constructor(fullName: string, email: string, presence: Presence[], position: string, subcompany: string) {
    this.fullName = fullName;
    this.email = email;
    this.presence =  presence;
    this.position = position;
    this.subcompany = subcompany;
  }
}

export { Employee };
