import { runMocha } from "../helper";

describe("test cases", () => {
  it("should detect mocha case", async () => {
    await runMocha(["passing"]);
  });
});
