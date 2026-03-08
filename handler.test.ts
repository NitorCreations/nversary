// Mock AWS SDK clients before importing handler
const mockGetObject = jest.fn();
const mockGetParameter = jest.fn();

jest.mock("aws-sdk/clients/s3", () => {
  class MockS3 {
    getObject = mockGetObject;
  }
  return { default: MockS3 };
});

jest.mock("aws-sdk/clients/ssm", () => {
  class MockSSM {
    getParameter = mockGetParameter;
  }
  return { default: MockSSM };
});

import { greeter } from "./handler";

describe("handler", () => {
  const mockContext = {
    awsRequestId: "test-request-id",
  } as any;

  const peopleMockData = {
    people: [
      {
        fullName: "John Doe",
        email: "john@example.com",
        presence: [{ start: "2020-02-06" }],
        position: "Engineer",
        businessUnit: "Tech",
      },
    ],
  };

  const slackConfigMockData = {
    slack: {
      webhookUrl: "https://hooks.slack.com/services/...",
      channelId: "C123456",
      appToken: "xoxb-token-123",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup S3 mock
    mockGetObject.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: {
          toString: jest.fn().mockReturnValue(JSON.stringify(peopleMockData)),
        },
      }),
    });

    // Setup SSM mock
    mockGetParameter.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Parameter: {
          Value: JSON.stringify(slackConfigMockData),
        },
      }),
    });

    // Set required environment variables
    process.env.PEOPLE_S3_BUCKET = "test-bucket";
    process.env.PEOPLE_S3_KEY = "test-key";
    process.env.SSM_PARAMETER_NAME = "/test/slack-config";
    process.env.SLACK_DRY_RUN = "false";
  });

  afterEach(() => {
    delete process.env.PEOPLE_S3_BUCKET;
    delete process.env.PEOPLE_S3_KEY;
    delete process.env.SSM_PARAMETER_NAME;
    delete process.env.SLACK_DRY_RUN;
  });

  it("should fetch people data from S3 and config from SSM", async () => {
    const event = { sendNow: false } as any;

    await greeter(event, mockContext);

    expect(mockGetObject).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "test-key",
    });

    expect(mockGetParameter).toHaveBeenCalledWith({
      Name: "/test/slack-config",
      WithDecryption: true,
    });
  });

  it("should use dateString from event when provided", async () => {
    const eventDate = "2021-06-15T10:30:00Z";
    const event = { dateString: eventDate, sendNow: false } as any;

    await greeter(event, mockContext);

    expect(mockGetObject).toHaveBeenCalled();
  });

  it("should use current date when dateString is not provided", async () => {
    const event = { sendNow: false } as any;

    await greeter(event, mockContext);

    expect(mockGetObject).toHaveBeenCalled();
  });

  it("should handle SLACK_DRY_RUN environment variable", async () => {
    process.env.SLACK_DRY_RUN = "true";
    const event = { sendNow: false } as any;

    await greeter(event, mockContext);

    expect(mockGetObject).toHaveBeenCalled();
  });
});
