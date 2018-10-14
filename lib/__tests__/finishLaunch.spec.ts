import {BaseReporter, getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("finishLaunch", () => {
  test("should finishLaunch", () => {
    const reporter = new Reporter(new BaseReporter(), {}, getOptions());
    reporter.client = new RPClient();
    reporter.tempLaunchId = "foo";
    reporter.end({});

    expect(reporter.client.finishLaunch).toBeCalledTimes(1);
    expect(reporter.client.finishLaunch).toBeCalledWith(reporter.tempLaunchId, {});
  });
});
