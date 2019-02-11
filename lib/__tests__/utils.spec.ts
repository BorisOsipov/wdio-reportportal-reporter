import {SuiteStartObj, TestStartObj} from "../entities";
import {addBrowserParam, addDescription, addTagsToSuite, getBrowserDescription, parseTags} from "../utils";

describe("#addTagsToSuite",  () => {
   test("should not add empty array of tags startSuite", () => {
     const suiteStartObj = new SuiteStartObj("foo");
     addTagsToSuite([], suiteStartObj);
     expect(suiteStartObj.tags).toBeUndefined();
   });

   test("should add tags startSuite", () => {
     const suiteStartObj = new SuiteStartObj("foo");
     addTagsToSuite([{name: "bar"}, {name: "baz"}], suiteStartObj);
     expect(suiteStartObj.tags).toEqual(["bar", "baz"]);
   });

   test("should add tags startSuite", () => {
     const suiteStartObj = new SuiteStartObj("foo");
     addTagsToSuite(["bar", "baz"], suiteStartObj);
     expect(suiteStartObj.tags).toEqual(["bar", "baz"]);
   });

   test("should add tags startSuite", () => {
     const suiteStartObj = new SuiteStartObj("foo");
     addTagsToSuite(undefined, suiteStartObj);
     expect(suiteStartObj.tags).toBeUndefined();
   });
});

describe("#addBrowserParam",  () => {
   test("should add browser name as parameter", () => {
     const testStartObj = new TestStartObj("foo");
     addBrowserParam("foo", testStartObj);
     expect(testStartObj.parameters).toEqual([{key: "browser", value: "foo"}]);
   });

   test("should not add if missing", () => {
     const testStartObj = new TestStartObj("foo");
     addBrowserParam(undefined, testStartObj);
     expect(testStartObj.parameters).toBeUndefined();
   });
});

describe("#addDescription",  () => {
   test("should add suite description", () => {
     const suiteStartObj = new SuiteStartObj("foo");
     addDescription("foo", suiteStartObj);
     expect(suiteStartObj.description).toEqual("foo");
   });

   test("should not add if missing", () => {
     const suiteStartObj = new SuiteStartObj("foo");
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

describe("#getBrowserDescription",  () => {
  test("should return empty string for empty capabilities", () => {
    expect(getBrowserDescription(undefined, "1-1")).toEqual("");
    expect(getBrowserDescription({}, "1-1")).toEqual("");
    expect(getBrowserDescription(null, "1-1")).toEqual("");
  });

  test("should return full browser description", () => {
    const browserDescription = getBrowserDescription(    {
      browserName: "chrome",
      platform: "WINDOWS",
      version: "72",
    }, "1-1");
    expect(browserDescription).toEqual("Chrome v.72 on Windows");
  });

  test("should omit platform if it is empty", () => {
    const browserDescription = getBrowserDescription(    {
      browserName: "safari",
      version: "42",
    }, "1-1");
    expect(browserDescription).toEqual("Safari v.42");
  });

  test("should omit version if it is empty", () => {
    const browserDescription = getBrowserDescription(    {
      browserName: "safari",
      platform: "MAC",
    }, "1-1");
    expect(browserDescription).toEqual("Safari on Mac");
  });

  test("should omit version, platform if it is empty", () => {
    const browserDescription = getBrowserDescription(    {
      browserName: "safari",
    }, "1-1");
    expect(browserDescription).toEqual("Safari");
  });

  test("should use deviceName/platformVersion for mobile", () => {
    const browserDescription = getBrowserDescription(    {
      deviceName: "android",
      platform: "WINDOWS",
      platformVersion: "72",
    }, "1-1");
    expect(browserDescription).toEqual("Android v.72 on Windows");
  });
});
