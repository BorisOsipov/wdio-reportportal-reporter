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
    expect(testStartObj.attributes).toEqual([]);
  });

  test("should trim long names", () => {
    expect(new StartTestItem(getStringWithLength(257), TYPE.STEP).name.length).toEqual(256);
    expect(new StartTestItem(getStringWithLength(256), TYPE.STEP).name.length).toEqual(256);
    expect(new StartTestItem(getStringWithLength(255), TYPE.STEP).name.length).toEqual(255);
  });

  test("should add SauseLab id", () => {
    const testStartObj = new StartTestItem("foo", TYPE.STEP);
    testStartObj.addSauseLabId("foo");
    expect(testStartObj.attributes).toEqual([{key: "SLID", value: "foo"}]);
  });

  test("should not add SauseLab id is empty", () => {
    const testStartObj = new StartTestItem("foo", TYPE.STEP);
    testStartObj.addSauseLabId(null);
    expect(testStartObj.attributes).toEqual([]);
  });
});
