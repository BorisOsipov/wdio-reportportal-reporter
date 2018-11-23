import {TYPE} from "../constants";
import {suiteStartEvent} from "./fixtures/events";
import {BaseReporter, getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("startSuite", () => {
  let reporter: any;

  beforeEach(() => {
    reporter = new Reporter(new BaseReporter(), {}, getOptions());
    reporter.client = new RPClient();
    reporter.tempLaunchId = "tempLaunchId";
  });

  test("should startSuite", () => {
    reporter.suiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "baz", name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should add tags startSuite", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {tags: [{name: "bar"}]}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "baz", name: "foo", type: TYPE.SUITE, tags: ["bar"]},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should omit description if empty", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {description: undefined}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should support nested suites", () => {
    reporter.suiteStart(suiteStartEvent());
    reporter.suiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      {description: "baz", name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.get(suiteStartEvent().cid);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {description: "baz", name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      id,
    );
  });

});
