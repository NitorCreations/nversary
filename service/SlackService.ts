import * as request from "request-promise";

import { SlackConfiguration } from "../domain/SlackConfiguration";
import { SlackUser } from "../domain/SlackUser";

class SlackService {
  public slackConfiguration: SlackConfiguration;

  constructor(slackConfiguration: SlackConfiguration) {
    this.slackConfiguration = slackConfiguration;
  }

  public scheduleMessage(message: string, contextMessage: string, date: Date) {
    const url = "https://slack.com/api/chat.scheduleMessage";
    
    if (this.slackConfiguration.dryRun) {
      return Promise.resolve(message);
    } else {
      return request.post(
          url,
          {
            json: {
              channel: this.slackConfiguration.channelId,
              // unix timestamp
              post_at: date.getTime() / 1000,
              text: message,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: message
                  }
                },
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: contextMessage
                    }
                  ]
                }
              ]
            },
            auth: {
              bearer: this.slackConfiguration.appToken
            },
          },
      );
    }
  }

  public sendMessage(message: string, contextMessage: string) {
    const url = this.slackConfiguration.webhookUrl;
    console.log("Send to slack " + message + ", url context message " + contextMessage + ", url " + url);

    if (this.slackConfiguration.dryRun) {
      return Promise.resolve(message);
    } else {
      return request.post(
          url,
          {
            json: {
              text: message,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: message
                  }
                },
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: contextMessage
                    }
                  ]
                }
              ]
            },
          },
      );
    }
  }

  public async getChannelUsers(): Promise<ReadonlyArray<SlackUser>>{
    const channelUsersIds = await this.getChannelUsersIds();
    console.log("Channel user ids " + channelUsersIds);
    const channelUsers = await this.getUsers()
    console.log("All users " + JSON.stringify(channelUsers));
    const filteredUsers = channelUsers.filter(user => channelUsersIds.includes(user.id));
    console.log("Filtered users " + JSON.stringify(filteredUsers));
    return filteredUsers;
  }

  private getUsers(): Promise<ReadonlyArray<SlackUser>> {
    const url = "https://slack.com/api/users.list?token=" + this.slackConfiguration.appToken;
    if (this.slackConfiguration.dryRun) {
      return Promise.resolve([]);
    } else {
      return request.get(url)
        .then((response) => JSON.parse(response).members
          .map((member) => new SlackUser(member.id, member.profile.real_name, member.profile.email)));
    }
  }

  private getChannelUsersIds(): Promise<ReadonlyArray<string>>{
    const url = "https://slack.com/api/channels.info?token=" + this.slackConfiguration.appToken;
    if (this.slackConfiguration.dryRun) {
      return Promise.resolve([]);
    } else {
      return request.post(
          url,
          {
            form: {
              channel: this.slackConfiguration.channelId,
            },
          },
      ).then((response) => JSON.parse(response).channel.members);
    }
  }
}

export { SlackService };
