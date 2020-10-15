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

    const tag = await this.getTag(congratulationDay.employeeToCongratulate1.email);
    const yearsAtCompany: number = this.yearsPresent(congratulationDay.employeeToCongratulate1, date);
    const startDate = congratulationDay.employeeToCongratulate1.presence[0].start;
    const startDateStr = `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}`;
    const message: string = `Congratulations *${congratulationDay.employeeToCongratulate1.fullName}* ${tag ? tag + " " : ""}` +
      `${yearsAtCompany} ${(yearsAtCompany === 1 ? "year" : "years")} at Nitor! :tada:`;
    const contextMessage = `${congratulationDay.employeeToCongratulate1.fullName} started at Nitor on ${startDateStr}`;
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

