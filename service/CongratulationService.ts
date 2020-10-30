import { CongratulationDay } from "../domain/CongratulationDay";
import { Employee } from "../domain/Employee";
import { SlackUser } from "../domain/SlackUser";
import { AnniversaryService } from "./AnniversaryService";
import { SlackService } from "./SlackService";

class CongratulationService {
  public anniversaryService: AnniversaryService;
  public slackService: SlackService;

  constructor(anniversaryService: AnniversaryService, slackService: SlackService ) {
    this.anniversaryService = anniversaryService;
    this.slackService = slackService;
  }

  public async congratulate(date: Date): Promise<void> {
    console.log("Congratulate on " + date);

    const congratulationDay: CongratulationDay = this.anniversaryService.getEmployeesToCongratulateToday(date);

    if(!congratulationDay || !congratulationDay.employeeToCongratulate1){
      console.log("No employees to congratulate today");
      return;
    }

    if(congratulationDay.employeeToCongratulate1){
      // send the first message at 11:50 UTC
      date.setHours(11);
      date.setMinutes(50);
      await this.congratulateEmployee(congratulationDay.employeeToCongratulate1, date);
    }
    if(congratulationDay.employeeToCongratulate2){
      // send the second message at 7:50 UTC
      date.setHours(11);
      date.setMinutes(50);
      await this.congratulateEmployee(congratulationDay.employeeToCongratulate2, date);
    }

    return Promise.resolve();
  }

  private async congratulateEmployee(employee : Employee, messageTime : Date){
    const tag = await this.getTag(employee.email);
    const yearsAtCompany: number = this.yearsPresent(employee, messageTime);
    const startDate = employee.presence[0].start;
    const startDateStr = `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}`;
    const message: string = `Congratulations *${employee.fullName}* ${tag ? tag + " " : ""}` +
      `${yearsAtCompany} ${(yearsAtCompany === 1 ? "year" : "years")} at Nitor! :tada:`;
    const contextMessage = `${employee.fullName} started at Nitor on ${startDateStr}`;
    await this.slackService.scheduleMessage(message, contextMessage, messageTime);
  }

  public yearsPresent(employee: Employee, now: Date): number {
    return now.getFullYear() - employee.presence[0].start.getFullYear();
  }

  public async getTag(email: string): Promise<string> {
    const user: SlackUser = (await this.slackService.getChannelUsers()).filter((u) => u.email === email).pop();
    return Promise.resolve(user ? "<@" + user.id  + ">": null);
  }
}

export { CongratulationService };

