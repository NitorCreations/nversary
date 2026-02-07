import { CongratulationDay } from "../domain/CongratulationDay";
import { Employee } from "../domain/Employee";
import { Presence } from "../domain/Presence";
import { SlackUser } from "../domain/SlackUser";
import { AnniversaryService } from "./AnniversaryService";
import { CongratulationService } from "./CongratulationService";
import { SlackService } from "./SlackService";
import { SlackConfiguration } from "../domain/SlackConfiguration";
import { IEmployeeRepository } from "../repository/EmployeeRepository";

const mockRepostitoryService: IEmployeeRepository = {
    findAllEmployees: jest.fn(() => []),
};
const anniversaryService = new AnniversaryService(mockRepostitoryService);
const slackService = new SlackService(new SlackConfiguration("", "", "", true));

const service = new CongratulationService(anniversaryService, slackService);

it("Sends message without tag", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date, maxPerDay: number) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 2 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime,
    );
});

it("Sends message with tag", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
    slackService.getUsers = jest.fn(() =>
        Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]),
    );
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* <@id> 2 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime,
    );
});

it("Sends message with profileImageUrl", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]));
    slackService.getUsers = jest.fn(() =>
        Promise.resolve([new SlackUser("id", "User Name", "asd@asd.com")]),
    );
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Senior Architect",
            "Software Company Oy",
            "https://example.com/image.jpg",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* <@id> 2 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2018 and works now as Senior Architect at Software Company Oy.",
        ],
        "https://example.com/image.jpg",
        sendTime,
    );
});

it("Sends 2 message if there are 2 persons to congratulate", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd1@asd.com",
            [new Presence(new Date("2017-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
        new Employee(
            "Maija Mallikas",
            "asd2@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Junior Architect",
            "Other Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date) => congratulationDay,
    );

    await service.congratulate(now, false);

    const sendTime1 = new Date("2020-02-06T11:40:00Z");
    const sendTime2 = new Date("2020-02-06T07:50:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Maija Mallikas* 2 years at Nitor! :tada:",
        [
            "Maija started at Nitor on 6.2.2018 and works now as Junior Architect at Other Company Oy.",
        ],
        undefined,
        sendTime2,
    );
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 3 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2017 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime1,
    );
});

it("Sends 3 message if there are 3 persons to congratulate", async () => {
    console.log("     XXXXXXXXXXX");
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd1@asd.com",
            [new Presence(new Date("2017-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
        new Employee(
            "Maija Mallikas",
            "asd2@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Junior Architect",
            "Other Company Oy",
        ),
        new Employee(
            "Minna Mallikas",
            "asd3@asd.com",
            [new Presence(new Date("2019-02-06"))],
            "Very Junior Architect",
            "Other Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date) => congratulationDay,
    );

    await service.congratulate(now, false);

    const sendTime1 = new Date("2020-02-06T11:40:00Z");
    const sendTime2 = new Date("2020-02-06T07:50:00Z");
    const sendTime3 = new Date("2020-02-06T09:45:00Z");

    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Maija Mallikas* 2 years at Nitor! :tada:",
        [
            "Maija started at Nitor on 6.2.2018 and works now as Junior Architect at Other Company Oy.",
        ],
        undefined,
        sendTime2,
    );
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 3 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2017 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime1,
    );
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Minna Mallikas* 1 year at Nitor! :tada:",
        [
            "Minna started at Nitor on 6.2.2019 and works now as Very Junior Architect at Other Company Oy.",
        ],
        undefined,
        sendTime3,
    );
});

it("Sends messages immediately if sendImmediately=true", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd1@asd.com",
            [new Presence(new Date("2017-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
        new Employee(
            "Maija Mallikas",
            "asd2@asd.com",
            [new Presence(new Date("2018-02-06"))],
            "Junior Architect",
            "Other Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date) => congratulationDay,
    );

    await service.congratulate(now, true);

    const sendTime = new Date(
        Math.ceil(new Date().getTime() / 1000) * 1000 + 10000,
    );

    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 3 years at Nitor! :tada:",
        [
            "Erkki started at Nitor on 6.2.2017 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime,
    );
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Maija Mallikas* 2 years at Nitor! :tada:",
        [
            "Maija started at Nitor on 6.2.2018 and works now as Junior Architect at Other Company Oy.",
        ],
        undefined,
        sendTime,
    );
});

it("Sends message special message on 5 year nversary", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2015-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date, maxPerDay: number) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 5 years at Nitor! :tada::palm_tree:",
        [
            "Erkki started at Nitor on 6.2.2015 and works now as Senior Architect at Software Company Oy.",
            "Achievement Unlocked: Nitor Nestori! :palm_tree:",
        ],
        undefined,
        sendTime,
    );
});

it("Sends message special message on 10 year nversary", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2010-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date, maxPerDay: number) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 10 years at Nitor! :tada::palm_tree::palm_tree:",
        [
            "Erkki started at Nitor on 6.2.2010 and works now as Senior Architect at Software Company Oy.",
            "Achievement Unlocked: Nitor Fellow! :palm_tree::palm_tree:",
        ],
        undefined,
        sendTime,
    );
});

it("Sends one extra emoji for 6-9 year nversary", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2012-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date, maxPerDay: number) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 8 years at Nitor! :tada::palm_tree:",
        [
            "Erkki started at Nitor on 6.2.2012 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime,
    );
});

it("Sends two extra emojis for 10+ year nversary", async () => {
    const now = new Date("2020-02-06T03:30:00Z");
    //slackService.getChannelUsers = jest.fn(() => Promise.resolve([]));
    slackService.getUsers = jest.fn(() => Promise.resolve([]));
    slackService.scheduleMessage = jest.fn((message, contextMessage, now) =>
        Promise.resolve(),
    );

    const congratulationDay = new CongratulationDay(now);
    congratulationDay.employees = [
        new Employee(
            "Erkki Esimerkki",
            "asd@asd.com",
            [new Presence(new Date("2009-02-06"))],
            "Senior Architect",
            "Software Company Oy",
        ),
    ];
    anniversaryService.getEmployeesToCongratulateToday = jest.fn(
        (date: Date, maxPerDay: number) => congratulationDay,
    );

    await service.congratulate(now, false);
    const sendTime = new Date("2020-02-06T11:40:00Z");
    expect(slackService.scheduleMessage).toBeCalledWith(
        "Congratulations *Erkki Esimerkki* 11 years at Nitor! :tada::palm_tree::palm_tree:",
        [
            "Erkki started at Nitor on 6.2.2009 and works now as Senior Architect at Software Company Oy.",
        ],
        undefined,
        sendTime,
    );
});
