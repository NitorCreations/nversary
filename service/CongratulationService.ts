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
    
    const sendTimes = [
      // send the message at 11:40 UTC (13:40 or 14:40 Finnish time)
      this.calculateSendTime(date, 11, 40),
      // send the message at 7:50 UTC (9:50 or 10:50 Finnish time)
      this.calculateSendTime(date, 7, 50),
      // TODO currently using only 2 slots per day
      // send the message at 9:45 UTC (11:45 or 12:45 Finnish time)
      // this.calculateSendTime(date, 9, 45),
    ];

    const maxPerDay = sendTimes.length;
    const congratulationDay : CongratulationDay | undefined = this.anniversaryService.getEmployeesToCongratulateToday(date, maxPerDay);

    if(!congratulationDay || congratulationDay.employees.length < 1){
      console.log("No employees to congratulate today");
      return;
    }
    
    for (let index = 0; index < congratulationDay.employees.length; index ++) {
      const employee = congratulationDay.employees[index];
      const sendTime = sendTimes[index];
      await this.congratulateEmployee(employee, sendTime, sendImmediately);
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
    const firstName = employee.fullName.replace(/ .*/, '');
    const contextMessage = `${firstName} started at Nitor on ${startDateStr} and works now as ${employee.position} at ${employee.subcompany}`;
    // TODO display special messages when yearsAtCompay == 5
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
