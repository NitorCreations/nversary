import { Employee } from "./Employee";

class CongratulationDay {
    public date: Date;
    public employees: Employee[] = [];

    constructor(date: Date) {
        this.date = date;
    }
}

export { CongratulationDay };
