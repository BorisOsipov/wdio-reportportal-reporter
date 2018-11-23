import ReporterOptions from "../ReporterOptions";

export class RPClient {
  public config: any;
  public helpers: any;
  public headers: any;
  public baseURL: string;

  public startLaunch = jest.fn().mockReturnValue({
       promise: Promise.resolve("ok"),
       tempId: "startLaunch",
      });

  public finishLaunch = jest.fn().mockReturnValue( {
     promise: Promise.resolve("ok"),
     tempId: "finishLaunch",
  });

  public startTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve("ok"),
      tempId: "startTestItem",
  });

  public finishTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve("ok"),
      tempId: "finishTestItem",
  });

  public sendLog = jest.fn().mockReturnValue({
      promise: Promise.resolve("ok"),
      tempId: "sendLog",
  });

  public getRequestLogWithFile = jest.fn().mockReturnValue(new Promise(() => {}));

  constructor(config?) {
    this.config = config;
    this.helpers = {
      getServerResult: jest.fn(),
      now: jest.fn(),
    };
    this.baseURL = "https://github.com/";
    this.headers = {
        foo: "bar",
    };
  }
}

export class BaseReporter {
  public epilogue = jest.fn();
  public props: any;
  constructor(props?) {
    this.props = props;
  }
}

export const getOptions = (options?: any): ReporterOptions => {
  return Object.assign(new ReporterOptions(), options);
};
