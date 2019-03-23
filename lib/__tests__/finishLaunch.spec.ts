import {getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../reporter");

describe("onRunnerEnd", () => {
  test("should wait all promises", async () => {
    const reporter = new Reporter(getOptions());
    reporter.client = new RPClient();
    reporter.tempLaunchId = "foo";
    await reporter.onRunnerEnd();

    expect(reporter.client.getPromiseFinishAllItems).toBeCalledTimes(1);
    expect(reporter.client.getPromiseFinishAllItems).toBeCalledWith(reporter.tempLaunchId);
    expect(reporter.isSynchronised).toBeTruthy();
  });

  test("should handle errors", async () => {
    const reporter = new Reporter(getOptions());
    reporter.client = new RPClient();
    reporter.client.getPromiseFinishAllItems = jest.fn().mockReturnValue(Promise.reject("fail"));
    await reporter.onRunnerEnd();

    expect(reporter.client.getPromiseFinishAllItems).toBeCalledTimes(1);
    expect(reporter.client.getPromiseFinishAllItems).toBeCalledWith(reporter.tempLaunchId);
    expect(reporter.rpPromisesCompleted).toBeTruthy();
  });
});
