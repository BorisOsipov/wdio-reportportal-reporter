import {WDIO_TEST_STATUS, CUCUMBER_TYPE, STATUS} from "../constants";
import {suiteEndEvent, suiteStartEvent} from "./fixtures/events";
import {singleAttribute} from "./fixtures/attributes"
import {getDefaultOptions, RPClientMock} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("endSuite", () => {
  let reporter: any;

  beforeEach(() => {
    reporter = new Reporter(getDefaultOptions());
    reporter.client = new RPClientMock();
    reporter.tempLaunchId = "tempLaunchId";
    reporter.onSuiteStart(suiteStartEvent());
  });

  test("should endSuite as passed", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(suiteEndEvent());

    expect(reporter.client.finishTestItem).toBeCalledTimes(1);
    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.PASSED,
        attributes: [],
        description: ""
      },


    );
  });



  test("should set given attributes to endSuite", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.addAttributeToSuite(singleAttribute)
    reporter.onSuiteEnd(suiteEndEvent());

    expect(reporter.client.finishTestItem).toBeCalledTimes(1);
    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.PASSED,
        attributes: [
          singleAttribute
        ],
        description: ""
      },

    );
  })

  test("should set given description", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.addDescriptionToCurrentSuite('new description')
    reporter.onSuiteEnd(suiteEndEvent());
    expect(reporter.client.finishTestItem).toBeCalledTimes(1);
    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.PASSED,
        attributes: [],
        description: "new description"
      },

    );
  })


  test("should set status as failing if there are failed tests", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(Object.assign(
      suiteEndEvent(),
      {
        tests: [
          {
            state: WDIO_TEST_STATUS.FAILED,
          },
          {
            state: WDIO_TEST_STATUS.PASSED,
          },
        ]
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.FAILED,
        attributes: [],
        description: ""
      },
    );
  });

  test("should set status as passed if all tests passed", () => {
    const {id} = reporter.storage.getCurrentSuite();
    reporter.onSuiteEnd(Object.assign(
      suiteEndEvent(),
      {
        tests: [
          {
            state: WDIO_TEST_STATUS.PASSED,
          },
          {
            state: WDIO_TEST_STATUS.PASSED,
          },
        ]
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.PASSED,
        attributes: [],
        description: ""
      },
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
            state: WDIO_TEST_STATUS.PASSED,
          },
          {
            state: WDIO_TEST_STATUS.PASSED,
          },
        ],
        type: CUCUMBER_TYPE.SCENARIO,
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.PASSED,
        attributes: [],
        description: ""
      },
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
            state: WDIO_TEST_STATUS.FAILED,
          },
          {
            state: WDIO_TEST_STATUS.PASSED,
          },
        ],
        type: CUCUMBER_TYPE.SCENARIO,
      }));

    expect(reporter.client.finishTestItem).toBeCalledWith(
      id,
      {
        status: STATUS.FAILED,
        attributes: [],
        description: ""
      },
    );
  });
});
