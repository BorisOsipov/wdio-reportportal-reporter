import {LEVEL} from "../constants";
import {getDefaultOptions} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("constructor", () => {
  test("should store configuration data", () => {
    const options = getDefaultOptions();
    const reporter = new Reporter(options);
    expect(reporter.options).toEqual(options);
  });

  test("should override default options", () => {
    const options = getDefaultOptions();
    options.debug = true;
    options.screenshotsLogLevel = LEVEL.TRACE;
    const reporter = new Reporter(options);
    expect(reporter.options.debug).toEqual(true);
    expect(reporter.options.screenshotsLogLevel).toEqual(LEVEL.TRACE);
  });

  test("should set isSynchronised", () => {
    const options = getDefaultOptions();
    const reporter = new Reporter(options);
    expect(reporter.isSynchronised).toEqual(true);
  });
});
