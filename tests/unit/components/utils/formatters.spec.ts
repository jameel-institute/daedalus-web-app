import { humanReadableNumber } from "@/components/utils/formatters";

describe("humanReadableNumber", () => {
  it("should convert number strings into comma-separated numbers", () => {
    expect(humanReadableNumber("12345")).toEqual("12,345");
  });
});
