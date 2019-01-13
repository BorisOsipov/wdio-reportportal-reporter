import {BaseReporter, getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("finishLaunch", () => {
  test("should finishLaunch", () => {
    const reporter = new Reporter(new BaseReporter(), {}, getOptions());
    Reporter.client = new RPClient();
    reporter.tempLaunchId = "foo";
    reporter.end({});

    expect(Reporter.client.finishLaunch).toBeCalledTimes(1);
    expect(Reporter.client.finishLaunch).toBeCalledWith(reporter.tempLaunchId, {});
  });
});
