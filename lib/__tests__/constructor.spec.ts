import {LEVEL} from "../constants";
import {BaseReporter, getOptions} from "./reportportal-client.mock";

const Reporter = require("../../build/reporter");

describe("constructor", () => {
  test("should store configuration data", () => {
    const options = getOptions();
    const baseReporter = new BaseReporter();
    const config = {foo: "bar"};
    const reporter = new Reporter(baseReporter, config, options);
    expect(reporter.baseReporter).toEqual(baseReporter);
    expect(reporter.options).toEqual(options);
  });

  test("should override default options", () => {
    const options = getOptions();
    options.debug = true;
    options.screenshotsLogLevel = LEVEL.TRACE;
    const reporter = new Reporter(new BaseReporter(), {foo: "bar"}, options);
    expect(reporter.options.debug).toEqual(true);
    expect(reporter.options.screenshotsLogLevel).toEqual(LEVEL.TRACE);
  });
});
