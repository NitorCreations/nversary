import { Presence } from "./Presence";

class Employee {
    public fullName: string;
    public email: string;
    public presence: Presence[];
    public position: string;
    public businessUnit: string;
    public profileImageUrl?: string;

    constructor(
        fullName: string,
        email: string,
        presence: Presence[],
        position: string,
        businessUnit: string,
        profileImageUrl?: string,
    ) {
        this.fullName = fullName;
        this.email = email;
        this.presence = presence;
        this.position = position;
        this.businessUnit = businessUnit;
        this.profileImageUrl = profileImageUrl;
    }
}

export { Employee };
