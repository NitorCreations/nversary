import { CongratulationDay } from "../domain/CongratulationDay";
import { IEmployeeRepository } from "../repository/EmployeeRepository";

class AnniversaryService {
  private employeeRepository: IEmployeeRepository;

  constructor(employeeRepository: IEmployeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  /**
   * Returns an object containing the employees that should be congratulated today 
   * 
   * @param date 
   */
  public getEmployeesToCongratulateToday(date: Date): CongratulationDay | undefined {
    const employee = this.getCongratulationsForThisMonth(date)
        .find((day) => day.date.getDate() === date.getDate());
    console.log("Employees to congratulate today: " + JSON.stringify(employee));
    return employee;
  }
  
  /**
   * Returns the days in this month when congratulation messages are sent with the employees
   * that should be congratulated on those days
   * 
   * @param date current date
   */
  private getCongratulationsForThisMonth(date: Date): Array<CongratulationDay> {
    // sort the employees based on the years in the company
    // this way the oldest employees will get priority if there are more
    // people to be congratulated than there are free slots on an available day
    const peopleWithAnniversaryThisMonth = this.employeeRepository.findAllEmployees()
        .filter((e) => e.presence[0].start.getMonth() == date.getMonth())
        .filter((e) => e.presence[0].start.getFullYear() !== date.getFullYear())
        .sort((e1, e2) => e1.presence[0].start.getFullYear() - e2.presence[0].start.getFullYear());

    const congratulationDaysInThisMonth = this.getCongratulationDaysForThisMonth(date);

    peopleWithAnniversaryThisMonth.forEach((employee) => {
      congratulationDaysInThisMonth
        // sort the days based on which is closest to the anniversary date,
        // this way the message will be sent as close to the actual date as possible
        .sort((d1, d2) => Math.abs(d1.date.getDate() - 
          employee.presence[0].start.getDate()) - Math.abs(d2.date.getDate() - employee.presence[0].start.getDate()));
          // find a free slot for the employee to be congratulated
          // each available day has 2 slots
          for(let day of congratulationDaysInThisMonth){
            
            if(day.employeeToCongratulate1 == null) {
              day.employeeToCongratulate1 = employee;
              break;
            } else if(day.employeeToCongratulate2 == null){
              day.employeeToCongratulate2 = employee;
              break;
            }

          }
    });
    return congratulationDaysInThisMonth;
  }
  
  /**
   * Returns the days when congratulations can be sent (work days)
   * 
   * @param d current date
   */
  private getCongratulationDaysForThisMonth(d: Date): Array<CongratulationDay> {
    const date = new Date();
    date.setTime(d.getTime());
    const currentMonth = date.getMonth();
    const days: Array<CongratulationDay> = [];
    
    for(let i = 1; i < 31; i++){
        date.setDate(i);
        if(date.getMonth() !== currentMonth){
            break;
        }

        if(date.getDay() !== 0 && date.getDay() !== 6){
          const newCongratulationDate = new Date();
          newCongratulationDate.setTime(date.getTime());
          days.push(new CongratulationDay(newCongratulationDate));
        }
    }
    return days;
  }
}

export { AnniversaryService };
