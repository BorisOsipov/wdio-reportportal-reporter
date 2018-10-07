import { runCucumber } from "../helper";

describe("Cucumber test cases", () => {
  it("should run Cucumber tests", async () => {
    await runCucumber(["failing"]);
  });
});
