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
      undefined,
    );
  });

  test("should not tags startSuite", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {tags: []}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "baz", name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      undefined,
    );
  });

  test("should add tags startSuite", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {tags: [{name: "bar"}]}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "baz", name: "foo", type: TYPE.SUITE, tags: ["bar"]},
      reporter.tempLaunchId,
      undefined,
    );
  });

  test("should add tags startSuite", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {tags: ["bar", "baz"]}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "baz", name: "foo", type: TYPE.SUITE, tags: ["bar", "baz"]},
      reporter.tempLaunchId,
      undefined,
    );
  });

  test("should omit description if empty", () => {
    reporter.suiteStart(Object.assign(suiteStartEvent(), {description: undefined}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      undefined,
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
      undefined,
    );

    const {id} = reporter.getParent(suiteStartEvent().cid);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {description: "baz", name: "foo", type: TYPE.SUITE},
      reporter.tempLaunchId,
      id,
    );
  });

});

// public suiteStart(suite) {
//   const suiteStartObj = new SuiteStartObj(suite.title);
//   if (suite.tags && suite.tags.length > 0) {
//     // check is it at least cucumber v1
//     if (suite.tags[0].name) {
//       suiteStartObj.tags = suite.tags.map((tag) => tag.name);
//     } else {
//       suiteStartObj.tags = suite.tags;
//     }
//   }
//
//   if (suite.description) {
//     suiteStartObj.description = suite.description;
//   }
//   const parent = this.getParent(suite.cid) || {};
//
//   const { tempId, promise } = this.client.startTestItem(
//     suiteStartObj,
//     this.tempLaunchId,
//     parent.id,
//   );
//   promiseErrorHandler(promise);
//   this.addParent(suite.cid, { type: TYPE.SUITE, id: tempId, promise });
// }
