import axios from "axios";
import { SlackConfiguration } from "../domain/SlackConfiguration";
import { SlackUser } from "../domain/SlackUser";

class SlackService {
  public slackConfiguration: SlackConfiguration;

  constructor(slackConfiguration: SlackConfiguration) {
    this.slackConfiguration = slackConfiguration;
  }

  /**
   * Post a scheduled message.
   * https://api.slack.com/methods/chat.scheduleMessage
   */
  public scheduleMessage(message: string, contextMessages: string[], profileImageUrl: string | undefined, date: Date) {
    
    if (this.slackConfiguration.dryRun) {
      return Promise.resolve(message);
    }
    const url = "https://slack.com/api/chat.scheduleMessage";
    const section: any = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message + '\n\n' + contextMessages.join('\n')
      }
    };
    // TODO need to check if image exists at this point?
    if (profileImageUrl) {
      section['accessory'] = {
        "type": "image",
        "image_url": profileImageUrl,
        // TODO remove alt?
        "alt_text": "images"
      }
    }
    const messageBody: any = {
      channel: this.slackConfiguration.channelId,
      // unix timestamp
      post_at: Math.ceil(date.getTime() / 1000),
      text: message,
      blocks: [section]
    };

    console.info(`Sending scheduled message at ${date}: \n`, JSON.stringify(messageBody));
    return axios.post(url, messageBody, {
      headers: {'Authorization': `Bearer ${this.slackConfiguration.appToken}`}
    }).then((response) => {
      if (!response.data.ok) {
        console.error('Failed to post message', response.data);
        throw Error(`Message sending failed: ${JSON.stringify(response.data)}`);
      } else {
        console.info("Message scheduled: ", response.status, response.statusText);
        console.info("Response data: ", JSON.stringify(response.data, null, 2));
      }
    });
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

  /**
   * Fetch list of all users.
   * https://api.slack.com/methods/users.list
   */
  public getUsers(): Promise<ReadonlyArray<SlackUser>> {
    const url = "https://slack.com/api/users.list"
    if (this.slackConfiguration.dryRun) {
      return Promise.resolve([]);
    } else {
      return axios.get(url, {
        headers: {'Authorization': `Bearer ${this.slackConfiguration.appToken}`}
      })
        .then((response) => {
          // TODO missing paging with cursors
          return response.data.members
           .map((member: any) => new SlackUser(member.id, member.profile.real_name, member.profile.email))
        });
    }
  }

  // https://api.slack.com/methods/channels.info
  // channels.info is deprecated, replaced by conversations.info or conversations.members
  private getChannelUsersIds(): Promise<ReadonlyArray<string>>{
    return Promise.resolve([]);
  }
}

export { SlackService };
