import { CongratulationDay } from "../domain/CongratulationDay";
import { Employee } from "../domain/Employee";
import { SlackUser } from "../domain/SlackUser";
import { AnniversaryService } from "./AnniversaryService";
import { SlackService } from "./SlackService";

class CongratulationService {
    public anniversaryService: AnniversaryService;
    public slackService: SlackService;

    constructor(
        anniversaryService: AnniversaryService,
        slackService: SlackService,
    ) {
        this.anniversaryService = anniversaryService;
        this.slackService = slackService;
    }

    public async congratulate(
        date: Date,
        sendImmediately: boolean,
    ): Promise<void> {
        console.log("Congratulate on " + date);

        // TODO if you change this, deploy change only at change month, otherwise some anniversaries may be duplicated or missed
        const sendTimes = [
            // send the message at 11:40 UTC (13:40 or 14:40 Finnish time)
            this.calculateSendTime(date, 11, 40),
            // send the message at 7:50 UTC (9:50 or 10:50 Finnish time)
            this.calculateSendTime(date, 7, 50),
            // send the message at 9:45 UTC (11:45 or 12:45 Finnish time)
            this.calculateSendTime(date, 9, 45),
        ];

        const maxPerDay = sendTimes.length;
        const congratulationDay: CongratulationDay | undefined =
            this.anniversaryService.getEmployeesToCongratulateToday(
                date,
                maxPerDay,
            );

        if (!congratulationDay || congratulationDay.employees.length < 1) {
            console.log("No employees to congratulate today");
            return;
        }

        for (
            let index = 0;
            index < congratulationDay.employees.length;
            index++
        ) {
            const employee = congratulationDay.employees[index];
            const sendTime = sendTimes[index];
            await this.congratulateEmployee(
                employee,
                sendTime,
                sendImmediately,
            );
        }
        return Promise.resolve();
    }

    private calculateSendTime(date: Date, hours: number, minutes: number) {
        const sendDate = new Date(date.getTime());
        sendDate.setUTCHours(hours);
        sendDate.setUTCMinutes(minutes);
        return sendDate;
    }

    private async congratulateEmployee(
        employee: Employee,
        messageTime: Date,
        sendImmediately: boolean,
    ) {
        const tag = employee.slackId
            ? `<@${employee.slackId}>`
            : await this.getTag(employee.email);
        const yearsAtCompany: number = this.yearsPresent(employee, messageTime);
        const startDate = employee.presence[0].start;
        const startDateStr = `${startDate.getDate()}.${
            startDate.getMonth() + 1
        }.${startDate.getFullYear()}`;
        const userTag = tag ? tag + " " : "";
        var yearEmojis = "";
        if (yearsAtCompany >= 10) {
            yearEmojis = ":palm_tree::palm_tree:";
        } else if (yearsAtCompany >= 5) {
            yearEmojis = ":palm_tree:";
        }
        const message: string =
            `Congratulations *${employee.fullName}* ${userTag}` +
            `${yearsAtCompany} ${
                yearsAtCompany === 1 ? "year" : "years"
            } at Nitor! :tada:${yearEmojis}`;
        const firstName = employee.fullName.replace(/ .*/, "");
        const contextMessages: string[] = [
            `${firstName} started at Nitor on ${startDateStr} and works now as ${employee.position} at ${employee.businessUnit}.`,
        ];

        if (yearsAtCompany === 5) {
            contextMessages.push(
                "Achievement Unlocked: Nitor Nestori! :palm_tree:",
            );
        } else if (yearsAtCompany == 10) {
            contextMessages.push(
                "Achievement Unlocked: Nitor Fellow! :palm_tree::palm_tree:",
            );
        }

        console.info("Wait a bit so Slack API rate limiter won't kick in");
        await new Promise((f) => setTimeout(f, 1500));

        const sendTime = sendImmediately
            ? new Date(Math.ceil(new Date().getTime() / 1000) * 1000 + 10000)
            : messageTime;

        console.info(`Scheduling a message for ${employee.fullName}`);
        await this.slackService.scheduleMessage(
            message,
            contextMessages,
            employee.profileImageUrl,
            sendTime,
        );
    }

    public yearsPresent(employee: Employee, now: Date): number {
        return now.getFullYear() - employee.presence[0].start.getFullYear();
    }

    public async getTag(email: string): Promise<string | null> {
        // TODO this fetches full user list for every employee that is congratulated
        // TODO should only show tag if user is in current channel?
        console.info("Wait a bit so Slack API rate limiter won't kick in");
        await new Promise((f) => setTimeout(f, 1500));
        console.info("Fetch Slack user list");
        const users = await this.slackService.getUsers();
        const user: SlackUser | undefined = users
            .filter((u) => u.email === email)
            .pop();
        return Promise.resolve(user && user.email ? `<@${user.id}>` : null);
    }
}

export { CongratulationService };
