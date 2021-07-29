class SlackUser {
  public id: string;
  public realName: string;
  public email: string;

  constructor(id: string, realName: string, email: string) {
    this.id = id;
    this.realName = realName;
    this.email = email;
  }
}

export { SlackUser };
