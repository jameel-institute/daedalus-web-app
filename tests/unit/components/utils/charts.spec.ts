import { costsPieTooltipText, plotBandsColor, timeSeriesColors } from "@/components/utils/charts";

describe("plotBandsColor", () => {
  it("should be in the correct rgba format", () => {
    const rgbaFormat = /^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),(\d(\.\d+)?)\)$/;
    expect(plotBandsColor).toMatch(rgbaFormat);
  });
});

describe("highchartsColors", () => {
  it("should be 9 colors long", () => {
    expect(timeSeriesColors).toHaveLength(9);
  });
});

describe("costs pie tooltip text", () => {
  it("should return the correct text", () => {
    expect(costsPieTooltipText({ name: "Test", value: 1_211 })).toBe(
      `<b>Test</b><br/>\n$1.2 billion<br/>\nX.Y% of national GDP`,
    );
  });
});
