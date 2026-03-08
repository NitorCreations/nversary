import axios from "axios";
import { SlackConfiguration } from "../domain/SlackConfiguration";
import { SlackService } from "./SlackService";
import { SlackUser } from "../domain/SlackUser";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("SlackService", () => {
  let slackService: SlackService;
  let slackConfig: SlackConfiguration;

  beforeEach(() => {
    jest.clearAllMocks();
    slackConfig = new SlackConfiguration(
      "webhook-url",
      "C123456",
      "xoxb-token-123",
      false
    );
    slackService = new SlackService(slackConfig);
  });

  describe("scheduleMessage()", () => {
    it("should return immediately in dry run mode without calling axios", async () => {
      const dryRunConfig = new SlackConfiguration(
        "webhook-url",
        "C123456",
        "xoxb-token-123",
        true
      );
      slackService = new SlackService(dryRunConfig);

      const result = await slackService.scheduleMessage(
        "Test message",
        ["context"],
        undefined,
        new Date()
      );

      expect(result).toBe("Test message");
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should post message to Slack API with correct headers and body", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: true },
        status: 200,
        statusText: "OK",
      });

      const date = new Date("2020-02-06T11:40:00Z");
      const expectedTimestamp = Math.ceil(date.getTime() / 1000);

      await slackService.scheduleMessage(
        "Test message",
        ["context1", "context2"],
        undefined,
        date
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://slack.com/api/chat.scheduleMessage",
        expect.objectContaining({
          channel: "C123456",
          post_at: expectedTimestamp,
          text: "Test message",
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Test message\n\ncontext1\ncontext2",
              },
            }),
          ]),
        }),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer xoxb-token-123",
            "Content-Type": "application/json; charset=utf-8",
          },
        })
      );
    });

    it("should include profileImageUrl as accessory when provided", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: true },
        status: 200,
        statusText: "OK",
      });

      const profileUrl = "https://example.com/image.jpg";
      const date = new Date("2020-02-06T11:40:00Z");

      await slackService.scheduleMessage(
        "Test message",
        ["context"],
        profileUrl,
        date
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              accessory: {
                type: "image",
                image_url: profileUrl,
                alt_text: "images",
              },
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it("should not include accessory when profileImageUrl is undefined", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: true },
        status: 200,
        statusText: "OK",
      });

      await slackService.scheduleMessage(
        "Test message",
        ["context"],
        undefined,
        new Date()
      );

      const callArgs = mockedAxios.post.mock.calls[0][1] as any;
      expect(callArgs.blocks[0].accessory).toBeUndefined();
    });

    it("should throw error when API response has ok=false", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: false, error: "channel_not_found" },
        status: 200,
        statusText: "OK",
      });

      await expect(
        slackService.scheduleMessage(
          "Test message",
          ["context"],
          undefined,
          new Date()
        )
      ).rejects.toThrow("Message sending failed");
    });
  });

  describe("getUsers()", () => {
    it("should return empty array in dry run mode without calling axios", async () => {
      const dryRunConfig = new SlackConfiguration(
        "webhook-url",
        "C123456",
        "xoxb-token-123",
        true
      );
      slackService = new SlackService(dryRunConfig);

      const users = await slackService.getUsers();

      expect(users).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should fetch users from Slack API and map to SlackUser objects", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          members: [
            {
              id: "U123",
              profile: { real_name: "John Doe", email: "john@example.com" },
            },
            {
              id: "U456",
              profile: { real_name: "Jane Smith", email: "jane@example.com" },
            },
          ],
        },
      });

      const users = await slackService.getUsers();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://slack.com/api/users.list",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer xoxb-token-123",
          },
        })
      );
      expect(users).toHaveLength(2);
      expect(users[0]).toEqual(
        expect.objectContaining({
          id: "U123",
          realName: "John Doe",
          email: "john@example.com",
        })
      );
      expect(users[1]).toEqual(
        expect.objectContaining({
          id: "U456",
          realName: "Jane Smith",
          email: "jane@example.com",
        })
      );
    });

    it("should cache the users promise and return cached result on second call", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          members: [
            {
              id: "U123",
              profile: { real_name: "John Doe", email: "john@example.com" },
            },
          ],
        },
      });

      const users1 = await slackService.getUsers();
      const users2 = await slackService.getUsers();

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(users1).toEqual(users2);
    });
  });

  describe("getChannelUsers()", () => {
    it("should return filtered users by channel IDs", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          members: [
            {
              id: "U123",
              profile: { real_name: "John Doe", email: "john@example.com" },
            },
            {
              id: "U456",
              profile: { real_name: "Jane Smith", email: "jane@example.com" },
            },
          ],
        },
      });

      const channelUsers = await slackService.getChannelUsers();

      // getChannelUsersIds() currently returns empty array, so result should be empty
      expect(channelUsers).toEqual([]);
    });
  });
});
