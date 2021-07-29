class SlackConfiguration {
  public webhookUrl: string;
  public channelId: string;
  public appToken: string;
  public dryRun: boolean;

  constructor(webhookUrl: string, channelId: string, appToken: string, dryRun: boolean) {
    this.webhookUrl = webhookUrl;
    this.channelId = channelId;
    this.appToken = appToken;
    this.dryRun = dryRun;
  }
}

export { SlackConfiguration };
