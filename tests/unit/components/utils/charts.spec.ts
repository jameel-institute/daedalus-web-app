import { describe, expect, it } from "vitest";
import { plotBandsColor, timeSeriesColors } from "@/components/utils/charts";

describe("plotBandsColor", () => {
  it("should be in the correct rgba format", () => {
    const rgbaFormat = /^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),(\d(\.\d+)?)\)$/;
    expect(plotBandsColor).toMatch(rgbaFormat);
  });
});

describe("timeSeriesColors", () => {
  it("should be 9 colors long", () => {
    expect(timeSeriesColors).toHaveLength(9);
  });
});
