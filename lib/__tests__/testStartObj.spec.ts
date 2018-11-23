import {TYPE} from "../constants";
import {TestStartObj} from "../entities";

function getStringWithLength(length: number) {
  return new Array(length + 1).join("S");
}

describe("TestStartObj", () => {
  test("should store name and default parameters", () => {
    const testStartObj = new TestStartObj("foo");

    expect(testStartObj.name).toEqual("foo");
    expect(testStartObj.type).toEqual(TYPE.STEP);
    expect(testStartObj.parameters).toBeUndefined();
    expect(testStartObj.tags).toBeUndefined();
  });

  test("should trim long names", () => {
    expect(new TestStartObj(getStringWithLength(257)).name.length).toEqual(256);
    expect(new TestStartObj(getStringWithLength(256)).name.length).toEqual(256);
    expect(new TestStartObj(getStringWithLength(255)).name.length).toEqual(255);
  });

});
