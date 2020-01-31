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

    const congratulationDay: CongratulationDay = this.anniversaryService.getEmployeeToCongratulateToday(date);

    if(!congratulationDay || !congratulationDay.employeeToCongratulate){
      console.log("No employees to congratulate today");
      return;
    }

    const tag = await this.getTag(congratulationDay.employeeToCongratulate.email);
    const yearsAtCompany: number = this.yearsPresent(congratulationDay.employeeToCongratulate, date);
    const startDate = congratulationDay.employeeToCongratulate.presence[0].start;
    const startDateStr = `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}`;
    const message: string = `Congratulations *${congratulationDay.employeeToCongratulate.fullName}* ${tag ? tag + " " : ""}` +
      `${yearsAtCompany} ${(yearsAtCompany === 1 ? "year" : "years")} at Nitor! :tada:`;
    const contextMessage = `${congratulationDay.employeeToCongratulate.fullName} started at Nitor on ${startDateStr}`;
    await this.slackService.sendMessage(message, contextMessage);
    return Promise.resolve();
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

