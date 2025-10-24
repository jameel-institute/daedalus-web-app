import { abbreviateMillions, commaSeparatedNumber, costAsPercentOfGdp, humanReadablePercentOfGdp } from "@/components/utils/formatters";

describe("commaSeparatedNumber", () => {
  it("should convert number strings into comma-separated numbers", () => {
    expect(commaSeparatedNumber("12345")).toEqual("12,345");
    expect(commaSeparatedNumber("12345.67")).toEqual("12,345.67");
    expect(commaSeparatedNumber("12,345.67")).toEqual("12,345.67");
    expect(commaSeparatedNumber("-12345")).toEqual("-12,345");
    expect(commaSeparatedNumber("-12345.67")).toEqual("-12,345.67");
    expect(commaSeparatedNumber("-12,345.67")).toEqual("-12,345.67");
  });
});

describe("costAsPercentOfGdp", () => {
  it("should return 0 if cost is undefined", () => {
    expect(costAsPercentOfGdp(undefined, 1000)).toEqual(0);
  });

  it("should return 0 if national GDP is undefined", () => {
    expect(costAsPercentOfGdp(100, undefined)).toEqual(0);
  });

  it("should calculate cost as percent of GDP", () => {
    expect(costAsPercentOfGdp(100, 1000)).toEqual(10);
    expect(costAsPercentOfGdp(200, 1000)).toEqual(20);
  });
});

describe("humanReadablePercentOfGdp", () => {
  it("should format number as percent of GDP", () => {
    expect(humanReadablePercentOfGdp(10)).toEqual({ percent: "10.0", reference: "of pre-pandemic GDP" });
    expect(humanReadablePercentOfGdp(200.5)).toEqual({ percent: "201", reference: "of pre-pandemic GDP" });
  });
});

describe("abbreviateMillions", () => {
  it("should convert numbers to trillions, defaulting to precision of 1", () => {
    expect(abbreviateMillions(1234567)).toEqual({ amount: "1.2", unit: "trillion" });
    expect(abbreviateMillions(1234567, true)).toEqual({ amount: "1.2", unit: "T" });
    expect(abbreviateMillions(1234567, true, 2)).toEqual({ amount: "1.23", unit: "T" });
  });

  it("should convert numbers to billions, defaulting to precision of 1", () => {
    expect(abbreviateMillions(1234)).toEqual({ amount: "1.2", unit: "billion" });
    expect(abbreviateMillions(1234, true)).toEqual({ amount: "1.2", unit: "B" });
    expect(abbreviateMillions(1234, true, 2)).toEqual({ amount: "1.23", unit: "B" });
  });

  it("should convert numbers to millions, defaulting to precision of 1", () => {
    expect(abbreviateMillions(1.2345)).toEqual({ amount: "1.2", unit: "million" });
    expect(abbreviateMillions(1.2345, true)).toEqual({ amount: "1.2", unit: "M" });
    expect(abbreviateMillions(1.2345, true, 2)).toEqual({ amount: "1.23", unit: "M" });
  });

  it("should convert numbers to thousands, defaulting to precision of 1", () => {
    expect(abbreviateMillions(0.0012345)).toEqual({ amount: "1.2", unit: "thousand" });
    expect(abbreviateMillions(0.0012345, true)).toEqual({ amount: "1.2", unit: "K" });
    expect(abbreviateMillions(0.0012345, true, 2)).toEqual({ amount: "1.23", unit: "K" });
  });

  it("should handle zero correctly", () => {
    expect(abbreviateMillions(0)).toEqual({ amount: "0.0", unit: "thousand" });
    expect(abbreviateMillions(0, true)).toEqual({ amount: "0.0", unit: "K" });
    expect(abbreviateMillions(0, true, 2)).toEqual({ amount: "0.00", unit: "K" });
  });
});
