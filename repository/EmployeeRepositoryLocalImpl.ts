import { Employee } from "../domain/Employee";
import { Presence } from "../domain/Presence";
import { IEmployeeRepository } from "./EmployeeRepository";

interface RawPresence {
    start: string;
}

interface RawEmployee {
    fullName: string;
    email: string;
    presence: RawPresence[];
    position: string;
    businessUnit: string;
    profileImageUrl?: string;
    slackId?: string;
}

interface PeopleData {
    people: RawEmployee[];
}

class EmployeeRepositoryLocalImpl implements IEmployeeRepository {
    public data: PeopleData;

    constructor(data: PeopleData) {
        this.data = data;
    }

    public findAllEmployees(): ReadonlyArray<Employee> {
        const people = this.data.people;
        return people.map(
            (p) =>
                new Employee(
                    p.fullName,
                    p.email,
                    p.presence.map(
                        (pres) => new Presence(new Date(pres.start)),
                    ),
                    p.position,
                    p.businessUnit,
                    p.profileImageUrl,
                ),
        );
    }
}

export { EmployeeRepositoryLocalImpl };
export type { PeopleData };
