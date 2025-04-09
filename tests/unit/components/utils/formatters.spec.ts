import { humanReadableInteger } from "@/components/utils/formatters";

describe("humanReadableInteger", () => {
  it("should convert number strings into comma-separated numbers", () => {
    expect(humanReadableInteger("12345")).toEqual("12,345");
  });
});
