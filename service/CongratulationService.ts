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

  public async congratulate(date: Date, sendImmediately: boolean): Promise<void> {
    console.log("Congratulate on " + date);

    const congratulationDay : CongratulationDay | undefined = this.anniversaryService.getEmployeesToCongratulateToday(date);

    if(!congratulationDay || !congratulationDay.employeeToCongratulate1){
      console.log("No employees to congratulate today");
      return;
    }

    if(congratulationDay.employeeToCongratulate1){
      // send the first message at 11:40 UTC
      const sendDate = this.calculateSendTime(date, 11, 40);
      await this.congratulateEmployee(congratulationDay.employeeToCongratulate1, sendDate, sendImmediately);
    }
    if(congratulationDay.employeeToCongratulate2){
      // send the second message at 7:50 UTC
      const sendDate = this.calculateSendTime(date, 7, 50);
      await this.congratulateEmployee(congratulationDay.employeeToCongratulate2, sendDate, sendImmediately);
    }

    return Promise.resolve();
  }

  private calculateSendTime(date: Date, hours: number, minutes: number) {
    const sendDate = new Date(date.getTime())
    sendDate.setUTCHours(hours);
    sendDate.setUTCMinutes(minutes);
    return sendDate;
  }

  private async congratulateEmployee(employee : Employee, messageTime : Date, sendImmediately: boolean){
    const tag = await this.getTag(employee.email);
    const yearsAtCompany: number = this.yearsPresent(employee, messageTime);
    const startDate = employee.presence[0].start;
    const startDateStr = `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}`;
    const userTag = tag ? tag + " " : "";
    const message: string = `Congratulations *${employee.fullName}* ${userTag}` +
      `${yearsAtCompany} ${(yearsAtCompany === 1 ? "year" : "years")} at Nitor! :tada:`;
    const contextMessage = `${employee.fullName} started at Nitor on ${startDateStr}`;
    // TODO display current subcompany and title
    // TODO display profile image
    if (sendImmediately) {
      const sendTime = new Date(Math.ceil(new Date().getTime() / 1000) * 1000 + 15000);
      await this.slackService.scheduleMessage(message, contextMessage, sendTime);
    } else {
      await this.slackService.scheduleMessage(message, contextMessage, messageTime); 
    }
  }

  public yearsPresent(employee: Employee, now: Date): number {
    return now.getFullYear() - employee.presence[0].start.getFullYear();
  }

  public async getTag(email: string): Promise<string | null> {
    // TODO should only show tag if user is in current channel?
    const users = await this.slackService.getUsers();
    const user: SlackUser | undefined = users.filter((u) => u.email === email).pop();
    return Promise.resolve((user && user.email) ? `<@${user.id}>` : null);
  }
}

export { CongratulationService };
