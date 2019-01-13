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
    expect(Reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      description: options.rpConfig.description,
      mode: options.rpConfig.mode,
      tags: options.rpConfig.tags,
    };
    expect(Reporter.client.startLaunch).toBeCalledWith(launchObj);
  });

  test("should startLaunch with custom parameters", () => {
    const options = getOptions();
    options.rpConfig.mode = MODE.DEBUG;
    options.rpConfig.tags = ["foo"];
    options.rpConfig.description = "bar";
    const reporter = new Reporter(new BaseReporter(), {}, options);
    const client = new RPClient();

    reporter.start({}, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(Reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      description: options.rpConfig.description,
      mode: options.rpConfig.mode,
      tags: options.rpConfig.tags,
    };
    expect(Reporter.client.startLaunch).toBeCalledWith(launchObj);
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
