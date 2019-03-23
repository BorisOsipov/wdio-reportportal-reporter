import {TYPE} from "../constants";
import {suiteStartEvent} from "./fixtures/events";
import {getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("startSuite", () => {
  let reporter: any;

  beforeEach(() => {
    reporter = new Reporter(getOptions());
    reporter.client = new RPClient();
    reporter.tempLaunchId = "tempLaunchId";
  });

  test("should startSuite", () => {
    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should omit description if empty", () => {
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {description: undefined}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should support nested suites", () => {
    reporter.onSuiteStart(suiteStartEvent());
    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      id,
    );
  });

});
