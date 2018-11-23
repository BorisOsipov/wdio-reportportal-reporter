import {LEVEL, MODE} from "../constants";
import {BaseReporter, getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("startLaunch", () => {
  test("should startLaunch with default mode", () => {
    const options = getOptions();
    const reporter = new Reporter(new BaseReporter(), {}, options);
    const client = new RPClient();

    reporter.start({}, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.client.startLaunch).toBeCalledTimes(1);
    expect(reporter.client.startLaunch).toBeCalledWith({mode: options.rpConfig.mode});
  });

  test("should startLaunch with debug", () => {
    const options = getOptions();
    options.rpConfig.mode = MODE.DEBUG;
    const reporter = new Reporter(new BaseReporter(), {}, options);
    const client = new RPClient();

    reporter.start({}, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.client.startLaunch).toBeCalledTimes(1);
    expect(reporter.client.startLaunch).toBeCalledWith({mode: options.rpConfig.mode});
  });
});

describe("constructor", () => {
  test("should store configuration data", () => {
    const options = getOptions();
    const baseReporter = new BaseReporter();
    const config = {foo: "bar"};
    const reporter = new Reporter(baseReporter, config, options);
    expect(reporter.baseReporter).toEqual(baseReporter);
    expect(reporter.options).toEqual(options);
  });

  test("should override default options", () => {
    const options = getOptions();
    options.debug = true;
    options.screenshotsLogLevel = LEVEL.TRACE;
    const reporter = new Reporter(new BaseReporter(), {foo: "bar"}, options);
    expect(reporter.options.debug).toEqual(true);
    expect(reporter.options.screenshotsLogLevel).toEqual(LEVEL.TRACE);
  });
});
