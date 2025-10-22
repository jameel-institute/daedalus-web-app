import { commaSeparatedNumber, costAsPercentOfGdp, humanReadablePercentOfGdp } from "@/components/utils/formatters";

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
