import {Attribute} from "../../build/ReporterOptions";
import {MODE} from "../constants";
import {getDefaultOptions, RPClientMock} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");
const REAL_LAUNCH_ID = "FOO_ID";
const runnerStat = {specs: ["foo"]};

describe("startLaunch", () => {
  afterEach(() => {
    delete process.env.RP_LAUNCH_ID;
  });

  test("should startLaunch with default mode", () => {
    const options = getDefaultOptions();
    const reporter = new Reporter(options);
    const client = new RPClientMock();
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    reporter.onRunnerStart(runnerStat, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.isSynchronised).toEqual(false);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      attributes: options.reportPortalClientConfig.attributes,
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });

  test("should startLaunch with custom parameters", () => {
    const options = getDefaultOptions();
    options.reportPortalClientConfig.mode = MODE.DEBUG;
    // @ts-ignore
    options.reportPortalClientConfig.attributes = [new Attribute("foo", "bar")];
    options.reportPortalClientConfig.description = "bar";
    const reporter = new Reporter(options);
    const client = new RPClientMock();
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    reporter.onRunnerStart(runnerStat, client);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      attributes: options.reportPortalClientConfig.attributes,
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });
});
