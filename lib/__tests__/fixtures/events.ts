import {WDIO_TEST_STATUS} from "../../constants";

export const suiteStartEvent = () => ({
  uid: "FooBarSuite",
  cid: "0-0",
  title: "foo",
  runner: {"0-0": {}},
  file: "C:/work/home/spec.ts"
});

export const suiteEndEvent = () => ({
  uid: "FooBarSuite",
  cid: "0-0",
  title: "foo",
  tests: [{
    state: WDIO_TEST_STATUS.PASSED,
  }]
});

export const testStartEvent = () => ({
  uid: "FooBarTest",
  fullTitle: "fullTitle",
  type: 'test',
  cid: "0-0",
  title: "foo",
  runner: {"0-0": {}}
});
