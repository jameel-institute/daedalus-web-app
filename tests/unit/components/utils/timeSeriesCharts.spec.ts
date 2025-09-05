import { addAlphaToRgb, multiScenarioTimeSeriesChartTooltipFormatter, plotBandsDefaultColor, plotLinesColor } from "~/components/utils/timeSeriesCharts";

const rgbFormat = /^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/;

describe("plotBandsDefaultColor", () => {
  it("should be in the correct rgb format", () => {
    expect(plotBandsDefaultColor).toMatch(rgbFormat);
  });
});

describe("plotLinesColor", () => {
  it("should be in the correct rgb format", () => {
    expect(plotLinesColor).toMatch(rgbFormat);
  });
});

describe("addAlphaToRgb", () => {
  it("should convert rgb to rgba", () => {
    const rgb = "rgb(255,0,0)";
    const alpha = 0.5;
    const rgba = addAlphaToRgb(rgb, alpha);
    expect(rgba).toBe("rgba(255,0,0,0.5)");
  });
});

describe("multiScenarioTimeSeriesChartTooltipFormatter", () => {
  const point = {
    series: {
      name: "Test Series",
      options: { custom: { isBaseline: false } },
      chart: {
        series: [
          {
            options: { custom: { isBaseline: true } },
            data: [{ x: 1, y: 100 }, { x: 2, y: 200 }],
          },
        ],
      },
    },
    x: 1,
    y: 1500,
  };

  it("should format tooltip correctly for non-baseline series", () => {
    const result = multiScenarioTimeSeriesChartTooltipFormatter(point, "deaths");
    expect(result).toContain("Test Series");
    expect(result).toContain("Day 1");
    expect(result).toContain("1,500");
    expect(result).toContain("deaths (baseline: 100)");
  });
});
