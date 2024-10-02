import { describe, expect, it } from "vitest";
import { highchartsColors, plotBandsColor } from "@/components/utils/charts";

describe("plotBandsColor", () => {
  it("should be in the correct rgba format", () => {
    const rgbaFormat = /^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),(\d(\.\d+)?)\)$/;
    expect(plotBandsColor).toMatch(rgbaFormat);
  });
});

describe("highchartsColors", () => {
  it("should be 9 colors long", () => {
    expect(highchartsColors).toHaveLength(9);
  });
});
