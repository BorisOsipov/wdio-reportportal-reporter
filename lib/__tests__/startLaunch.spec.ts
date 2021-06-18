import {Attribute} from "../../build/ReporterOptions";
import {MODE} from "../constants";
import {getDefaultOptions, RPClientMock} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");
const REAL_LAUNCH_ID = "FOO_ID";
const runnerStat = {specs: ["foo"], config: {framework: "mocha"}, retry: 0};

describe("startLaunch", () => {
  afterEach(() => {
    delete process.env.RP_LAUNCH_ID;
  });

  test("should startLaunch with default mode", () => {
    const options = getDefaultOptions();
    const reporter = new Reporter(options);
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    jest.spyOn(reporter, 'getReportPortalClient').mockImplementation(() =>  new RPClientMock());

    reporter.onRunnerStart(runnerStat);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.isSynchronised).toEqual(false);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      attributes: options.reportPortalClientConfig.attributes,
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
      rerun: false,
      rerunOf: null,
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
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    jest.spyOn(reporter, 'getReportPortalClient').mockImplementation(() =>  new RPClientMock());
    reporter.onRunnerStart(runnerStat);

    expect(reporter.tempLaunchId).toEqual("startLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      attributes: options.reportPortalClientConfig.attributes,
      description: options.reportPortalClientConfig.description,
      id: REAL_LAUNCH_ID,
      mode: options.reportPortalClientConfig.mode,
      rerun: false,
      rerunOf: null,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });

  test("should start rerun launch for suite retry", () => {
    const options = getDefaultOptions();
    const reporter = new Reporter(options);
    process.env.RP_LAUNCH_ID = REAL_LAUNCH_ID;

    const mock = () =>  {
      const rpClientMock = new RPClientMock();
      rpClientMock.startLaunch = jest.fn().mockReturnValue({
        promise: Promise.resolve("ok"),
        tempId: "startRerunLaunch",
      });
      return rpClientMock
    };
    jest.spyOn(reporter, 'getReportPortalClient').mockImplementation(mock);
    runnerStat.retry = 1;
    reporter.onRunnerStart(runnerStat);

    expect(reporter.tempLaunchId).toEqual("startRerunLaunch");
    expect(reporter.launchId).toEqual(REAL_LAUNCH_ID);
    expect(reporter.client.startLaunch).toBeCalledTimes(1);

    const launchObj = {
      attributes: options.reportPortalClientConfig.attributes,
      description: options.reportPortalClientConfig.description,
      mode: options.reportPortalClientConfig.mode,
      rerun: true,
      rerunOf: REAL_LAUNCH_ID,
    };
    expect(reporter.client.startLaunch).toBeCalledWith(launchObj);
  });
});
