import { Employee } from "./Employee";

class CongratulationDay {
    public date: Date;
    public employeeToCongratulate1: Employee;
    public employeeToCongratulate2: Employee;

    constructor(date: Date) {
        this.date = date;
    }
}

export {CongratulationDay};
