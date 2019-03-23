import {MODE} from "../constants";
import {getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");
const REAL_LAUNCH_ID = "FOO_ID";

describe("startLaunch", () => {
  afterEach(() => {
    delete process.env.RP_LAUNCH_ID;
  });

  test("should startLaunch with default mode", () => {
    const options = getOptions();
    const reporter = new Reporter(options);
    const client = new RPClient();
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    reporter.onRunnerStart({}, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
      tags: options.reportPortalClientConfig.tags,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });

  test("should startLaunch with custom parameters", () => {
    const options = getOptions();
    options.reportPortalClientConfig.mode = MODE.DEBUG;
    options.reportPortalClientConfig.tags = ["foo"];
    options.reportPortalClientConfig.description = "bar";
    const reporter = new Reporter(options);
    const client = new RPClient();
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    reporter.onRunnerStart({}, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
      tags: options.reportPortalClientConfig.tags,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });
});
