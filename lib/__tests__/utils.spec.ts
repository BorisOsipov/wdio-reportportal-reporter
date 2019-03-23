import {TYPE} from "../constants";
import {StartTestItem} from "../entities";
import {addBrowserParam, addDescription, isScreenshotCommand, parseTags, sendToReporter} from "../utils";

let processEmit;

describe("utils#sendToReporter", () => {
  beforeAll(() => {
    processEmit = process.emit;
    process.emit = jest.fn();
  });

  afterAll(() => {
    process.emit = processEmit;
  });

  afterEach(() => {
    // @ts-ignore
    process.emit.mockClear();
  });

  test("should accept message", () => {
    sendToReporter("foo", {bar: "baz"});
    expect(process.emit).toHaveBeenCalledTimes(1);
    expect(process.emit).toHaveBeenCalledWith("foo", {bar: "baz"});
  });

  test("should accept no message", () => {
    sendToReporter("foo");
    expect(process.emit).toHaveBeenCalledTimes(1);
    expect(process.emit).toHaveBeenCalledWith("foo", {});
  });
});

describe("#addBrowserParam",  () => {
   test("should add browser name as parameter", () => {
     const testStartObj = new StartTestItem("foo", TYPE.TEST);
     addBrowserParam("foo", testStartObj);
     expect(testStartObj.parameters).toEqual([{key: "browser", value: "foo"}]);
   });

   test("should not clear other params", () => {
     const testStartObj = new StartTestItem("foo", TYPE.TEST);
     testStartObj.parameters = ["bar"];
     addBrowserParam("foo", testStartObj);
     expect(testStartObj.parameters).toEqual(["bar", {key: "browser", value: "foo"}]);
   });

   test("should not add if missing", () => {
     const testStartObj = new StartTestItem("foo", TYPE.TEST);
     addBrowserParam(undefined, testStartObj);
     expect(testStartObj.parameters).toBeUndefined();
   });
});

describe("#addDescription",  () => {
   test("should add suite description", () => {
     const suiteStartObj = new StartTestItem("foo", TYPE.SUITE);
     addDescription("foo", suiteStartObj);
     expect(suiteStartObj.description).toEqual("foo");
   });

   test("should not add if missing", () => {
     const suiteStartObj = new StartTestItem("foo", TYPE.SUITE);
     addDescription(undefined, suiteStartObj);
     expect(suiteStartObj.description).toBeUndefined();
   });
});

describe("#parseTags",  () => {
   test("should return empty array for string without tags", () => {
     expect(parseTags("foo")).toEqual([]);
     expect(parseTags("foo bar baz")).toEqual([]);
     expect(parseTags("")).toEqual([]);
     // @ts-ignore
     expect(parseTags()).toEqual([]);
     // @ts-ignore
     expect(parseTags(1)).toEqual([]);
   });

   test("should return tags from string", () => {
     expect(parseTags("@foo")).toEqual(["@foo"]);
     expect(parseTags("Some text @foo")).toEqual(["@foo"]);
     expect(parseTags("@foo Some text ")).toEqual(["@foo"]);
     expect(parseTags("@fo1o Some text @2bar")).toEqual(["@fo1o", "@2bar"]);
     expect(parseTags("@foo-me Some text @bar_ce test")).toEqual(["@foo-me", "@bar_ce"]);
   });
});

describe("#isScreenshotCommand",  () => {
  test("isScreenshotCommand", () => {
    expect(isScreenshotCommand({endpoint: "/session/id/screenshot"})).toEqual(true);
    expect(isScreenshotCommand({endpoint: "/wd/hub/session/id/screenshot"})).toEqual(true);
    expect(isScreenshotCommand({endpoint: "/session/id/click"})).toEqual(false);
  });
});
