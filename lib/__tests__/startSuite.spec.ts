import {CUCUMBER_TYPE, TYPE} from "../constants";
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
      {name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should omit description if empty", () => {
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {description: undefined}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: undefined, name: "foo", type: TYPE.SUITE, retry: false},
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
      {name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      id,
    );
  });

  test("should support cucumber nested steps", () => {
    Object.assign(reporter.options, {cucumberNestedSteps: true});
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.FEATURE}));
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.SCENARIO}));

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      {name: "foo", type: TYPE.TEST, retry: false},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {name: "foo", type: TYPE.STEP, retry: false},
      reporter.tempLaunchId,
      id,
    );
  });

  test("should add attribute with feature name to scenario", () => {
    Object.assign(reporter.options, {cucumberNestedSteps: true, autoAttachCucumberFeatureToScenario: true});
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.FEATURE, title: "foo"}));
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.SCENARIO}));

    expect(reporter.featureName).toEqual("foo");
    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {name: "foo", type: TYPE.STEP, retry: false, attributes: [{key: CUCUMBER_TYPE.FEATURE, value: "foo"}]},
      reporter.tempLaunchId,
      id,
    );
  });

});
