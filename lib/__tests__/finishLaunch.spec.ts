import {getDefaultOptions, RPClientMock} from "./reportportal-client.mock";

const Reporter = require("../reporter");

describe("onRunnerEnd", () => {
  test("should wait all promises", async () => {
    const reporter = new Reporter(getDefaultOptions());
    reporter.client = new RPClientMock();
    reporter.tempLaunchId = "foo";
    await reporter.onRunnerEnd();

    expect(reporter.client.getPromiseFinishAllItems).toBeCalledTimes(1);
    expect(reporter.client.getPromiseFinishAllItems).toBeCalledWith(reporter.tempLaunchId);
    expect(reporter.isSynchronised).toBeTruthy();
  });

  test("should handle errors", async () => {
    const reporter = new Reporter(getDefaultOptions());
    reporter.client = new RPClientMock();
    reporter.client.getPromiseFinishAllItems = jest.fn().mockReturnValue(Promise.reject("fail"));
    await reporter.onRunnerEnd();

    expect(reporter.client.getPromiseFinishAllItems).toBeCalledTimes(1);
    expect(reporter.client.getPromiseFinishAllItems).toBeCalledWith(reporter.tempLaunchId);
    expect(reporter.rpPromisesCompleted).toBeTruthy();
  });
});
