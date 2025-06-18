import { humanReadableInteger } from "@/components/utils/formatters";

describe("humanReadableInteger", () => {
  it("should convert number strings into comma-separated numbers", () => {
    expect(humanReadableInteger("12345")).toEqual("12,345");
  });

  it("should return non-integer strings unchanged", () => {
    expect(humanReadableInteger("abc")).toEqual("abc");
    expect(humanReadableInteger("12345.67")).toEqual("12345.67");
  });
});
