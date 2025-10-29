import { abbreviateMillionsDollars, commaSeparatedNumber, costAsPercentOfGdp, humanReadablePercentOfGdp } from "@/components/utils/formatters";

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
    expect(humanReadablePercentOfGdp(10)).toEqual({ percent: "10.0%", reference: "of pre-pandemic GDP" });
    expect(humanReadablePercentOfGdp(200.5)).toEqual({ percent: "201%", reference: "of pre-pandemic GDP" });
    expect(humanReadablePercentOfGdp(12345.678)).toEqual({ percent: "12,346%", reference: "of pre-pandemic GDP" });
  });
});

describe("abbreviateMillionsDollars", () => {
  it("should convert numbers to trillions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1234567)).toEqual({ amount: "$1.2", unit: "trillion" });
    expect(abbreviateMillionsDollars(1234567, true)).toEqual({ amount: "$1.2", unit: "T" });
    expect(abbreviateMillionsDollars(1234567, true, 2)).toEqual({ amount: "$1.23", unit: "T" });
  });

  it("should convert numbers to billions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1234)).toEqual({ amount: "$1.2", unit: "billion" });
    expect(abbreviateMillionsDollars(1234, true)).toEqual({ amount: "$1.2", unit: "B" });
    expect(abbreviateMillionsDollars(1234, true, 2)).toEqual({ amount: "$1.23", unit: "B" });
  });

  it("should convert numbers to millions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1.2345)).toEqual({ amount: "$1.2", unit: "million" });
    expect(abbreviateMillionsDollars(1.2345, true)).toEqual({ amount: "$1.2", unit: "M" });
    expect(abbreviateMillionsDollars(1.2345, true, 2)).toEqual({ amount: "$1.23", unit: "M" });
  });

  it("should handle small numbers correctly", () => {
    expect(abbreviateMillionsDollars(0.0012345)).toEqual({ amount: "<$1", unit: "million" });
    expect(abbreviateMillionsDollars(0.0012345, true)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0.0012345, true, 2)).toEqual({ amount: "<$1", unit: "M" });
  });

  it("should handle zero correctly", () => {
    expect(abbreviateMillionsDollars(0)).toEqual({ amount: "<$1", unit: "million" });
    expect(abbreviateMillionsDollars(0, true)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0, true, 2)).toEqual({ amount: "<$1", unit: "M" });
  });
});
