import {TYPE} from "../constants";
import {StartTestItem} from "../entities";

function getStringWithLength(length: number) {
  return new Array(length + 1).join("S");
}

describe("StartTestItem", () => {
  test("should store name and default parameters", () => {
    const testStartObj = new StartTestItem("foo", TYPE.STEP);

    expect(testStartObj.name).toEqual("foo");
    expect(testStartObj.type).toEqual(TYPE.STEP);
    expect(testStartObj.parameters).toBeUndefined();
    expect(testStartObj.tags).toBeUndefined();
  });

  test("should trim long names", () => {
    expect(new StartTestItem(getStringWithLength(257), TYPE.STEP).name.length).toEqual(256);
    expect(new StartTestItem(getStringWithLength(256), TYPE.STEP).name.length).toEqual(256);
    expect(new StartTestItem(getStringWithLength(255), TYPE.STEP).name.length).toEqual(255);
  });

});
