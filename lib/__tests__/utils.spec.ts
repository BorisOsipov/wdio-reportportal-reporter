import {SuiteStartObj, TestStartObj} from "../entities";
import {addBrowserParam, addDescription, addTagsToSuite, parseTags} from "../utils";

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
