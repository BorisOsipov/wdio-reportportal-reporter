import {CUCUMBER_TYPE, TYPE} from "../constants";
import {suiteStartEvent} from "./fixtures/events";
import {getDefaultOptions, RPClientMock} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("startSuite", () => {
  let reporter: any;

  beforeEach(() => {
    reporter = new Reporter(getDefaultOptions());
    reporter.client = new RPClientMock();
    reporter.tempLaunchId = "tempLaunchId";
    reporter.specFilePath = "C:/work/home/spec.ts"
  });

  test("should startSuite", () => {
    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );
  });

  test("should omit description if empty", () => {
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {description: undefined}));

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
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
      {description: "", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {description: "", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      id,
    );
  });

  test("should support cucumber nested steps", () => {
    Object.assign(reporter.reporterOptions, {cucumberNestedSteps: true});
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.FEATURE}));
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.SCENARIO}));

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      {description: "", attributes: [], name: "foo", type: TYPE.TEST, retry: false},
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {
        description: "",
        attributes: [],
        name: "foo",
        type: TYPE.STEP,
        retry: false,
        codeRef: "C:/work/home/spec.ts:FooBarSuite"
      },
      reporter.tempLaunchId,
      id,
    );
  });

  test("should add attribute with feature name to scenario", () => {
    Object.assign(reporter.reporterOptions, {cucumberNestedSteps: true, autoAttachCucumberFeatureToScenario: true});
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.FEATURE, title: "foo"}));
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.SCENARIO}));

    expect(reporter.featureName).toEqual("foo");
    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {
        name: "foo",
        type: TYPE.STEP,
        retry: false,
        attributes: [{key: CUCUMBER_TYPE.FEATURE, value: "foo"}],
        codeRef: "C:/work/home/spec.ts:FooBarSuite",
        description: ""
      },
      reporter.tempLaunchId,
      id,
    );
  });

  test("should set description for current suite", () => {

    reporter.addDescriptionToCurrentSuite('new description')
    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "new description", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );
  })

  test("should set description for all suite", () => {

    reporter.addDescriptionToAllSuites('new description')
    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(1);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "new description", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );

    reporter.onSuiteStart(suiteStartEvent());

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toBeCalledWith(
      {description: "new description", attributes: [], name: "foo", type: TYPE.SUITE, retry: false},
      reporter.tempLaunchId,
      null,
    );
  })

  test("should add sldc/slid to cucumber test", () => {
    const sauceLabOptions = {
      enabled: true,
      sldc: "foo"
    }
    Object.assign(reporter.reporterOptions, {cucumberNestedSteps: true, sauceLabOptions});
    reporter.sessionId = "bar";
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.FEATURE}));
    reporter.onSuiteStart(Object.assign(suiteStartEvent(), {type: CUCUMBER_TYPE.SCENARIO}));

    expect(reporter.client.startTestItem).toBeCalledTimes(2);
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      1,
      {
        description: "",
        attributes: [{key: "SLID", value: "bar"}, {key: "SLDC", value: "foo"}],
        name: "foo",
        type: TYPE.TEST,
        retry: false
      },
      reporter.tempLaunchId,
      null,
    );

    const {id} = reporter.storage.getCurrentSuite();
    expect(reporter.client.startTestItem).toHaveBeenNthCalledWith(
      2,
      {
        description: "",
        attributes: [],
        name: "foo",
        type: TYPE.STEP,
        retry: false,
        codeRef: "C:/work/home/spec.ts:FooBarSuite"
      },
      reporter.tempLaunchId,
      id,
    );
  });
});
