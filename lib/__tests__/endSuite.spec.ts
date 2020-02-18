import {CUCUMBER_STATUS, CUCUMBER_TYPE, STATUS} from "../constants";
import {suiteEndEvent, suiteStartEvent} from "./fixtures/events";
import {getOptions, RPClient} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("endSuite", () => {
  let reporter: any;

  beforeEach(() => {
    reporter = new Reporter(getOptions());
    reporter.client = new RPClient();
    reporter.tempLaunchId = "tempLaunchId";
    reporter.onSuiteStart(suiteStartEvent());
  });

  test("should endSuite", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(suiteEndEvent());

    expect(reporter.client.finishTestItem).toBeCalledTimes(1);
    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {status: STATUS.PASSED},
    );
  });

  test("should set status as passing for cucumber nested steps", () => {
    Object.assign(reporter.options, {cucumberNestedSteps: true});
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(Object.assign(
      suiteEndEvent(),
      {
        tests: [
          {
            state: CUCUMBER_STATUS.PASSED,
          },
          {
            state: CUCUMBER_STATUS.PASSED,
          },
        ],
        type: CUCUMBER_TYPE.SCENARIO,
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {status: STATUS.PASSED},
    );
  });

  test("should set status as failing for cucumber nested steps", () => {
    Object.assign(reporter.options, {cucumberNestedSteps: true});
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(Object.assign(
      suiteEndEvent(),
      {
        tests: [
          {
            state: CUCUMBER_STATUS.FAILED,
          },
          {
            state: CUCUMBER_STATUS.PASSED,
          },
        ],
        type: CUCUMBER_TYPE.SCENARIO,
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {status: STATUS.FAILED},
    );
  });
});
