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

  test("should add SauceLab id", () => {
    const testStartObj = new StartTestItem("foo", TYPE.STEP);
    testStartObj.addSLID("foo");
    expect(testStartObj.attributes).toEqual([{key: "SLID", value: "foo"}]);
  });

  test("should add SauseLab region id", () => {
    const testStartObj = new StartTestItem("foo", TYPE.STEP);
    testStartObj.addSLDC("foo");
    expect(testStartObj.attributes).toEqual([{key: "SLDC", value: "foo"}]);
  });
});
