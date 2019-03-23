import {LEVEL} from "../constants";
import {getOptions} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("constructor", () => {
  test("should store configuration data", () => {
    const options = getOptions();
    const reporter = new Reporter(options);
    expect(reporter.options).toEqual(options);
  });

  test("should override default options", () => {
    const options = getOptions();
    options.debug = true;
    options.screenshotsLogLevel = LEVEL.TRACE;
    const reporter = new Reporter(options);
    expect(reporter.options.debug).toEqual(true);
    expect(reporter.options.screenshotsLogLevel).toEqual(LEVEL.TRACE);
  });

  test("should override default options", () => {
    const options = getOptions();
    const reporter = new Reporter(options);
    expect(reporter.isSynchronised).toEqual(false);
  });
});
