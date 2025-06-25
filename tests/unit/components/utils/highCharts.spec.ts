import { costsChartLabelFormatter, costsChartStackLabelFormatter, costsChartTooltipText, getColorVariants, plotBandsColor, timeSeriesColors } from "~/components/utils/highCharts";
import { CostBasis } from "~/types/unitTypes";

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

describe("costs chart tooltip text", () => {
  const tooltipPointInstance = {
    total: 2000,
    point: {
      category: "Life years",
    },
    points: [
      {
        point: {
          custom: { includeInTooltips: true },
        },
        y: 999,
        color: "#FF0000",
        key: "Working-age adults",
      },
      {
        point: {
          custom: { includeInTooltips: true },
        },
        y: 0,
        color: "#00FF00",
        key: "Children",
      },
      {
        point: {
          custom: { includeInTooltips: false },
        },
        y: 0,
        color: "#FF0000",
        key: "Do not include in tooltips",
      },
    ],
  };

  it("should return the correct text for the stack's tooltip, when cost basis is USD", () => {
    const tooltipText = costsChartTooltipText(tooltipPointInstance, CostBasis.USD, 4000);
    expect(tooltipText).toMatch(
      /Life years losses.*\$2.0 billion.*50.0% of 2018 national GDP.*#FF0000.*Working-age adults.*\$999.0 M.*#00FF00.*Children.*\$0.0 M/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });

  it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
    const tooltipText = costsChartTooltipText(tooltipPointInstance, CostBasis.PercentGDP, 2_222_222);
    expect(tooltipText).toMatch(
      /Life years losses.*2000.0%.* of 2018 national GDP.*#FF0000.*Working-age adults.*999.0%.*#00FF00.*Children.*0.0%/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });
});

describe("costsChartStackLabelFormatter", () => {
  it("should return the correct stack label for USD cost basis", () => {
    const label = costsChartStackLabelFormatter(200, CostBasis.USD);
    expect(label).toBe("$0.2 billion");
  });

  it("should return the correct stack label for percent of GDP cost basis", () => {
    const label = costsChartStackLabelFormatter(20, CostBasis.PercentGDP);
    expect(label).toBe("20.0% of GDP");
  });
});

describe("costsChartLabelFormatter", () => {
  it("should return the correct y-axis tick label for USD cost basis", () => {
    const label = costsChartLabelFormatter(200, CostBasis.USD);
    expect(label).toBe("0 B");
  });

  it("should return the correct y-axis tick label for percent of GDP cost basis", () => {
    const label = costsChartLabelFormatter(20, CostBasis.PercentGDP);
    expect(label).toBe("20%");
  });
});

describe("getColorVariants", () => {
  it("creates a range of N colors from a base color", () => {
    const baseColor = "#990000FF";
    const variants = getColorVariants(baseColor, 5);
    expect(variants).toHaveLength(5);
    expect(variants[0].replace(/\s/g, "")).toBe("rgba(191,0,0,1)");
    expect(variants[1].replace(/\s/g, "")).toBe("rgba(172,0,0,1)");
    expect(variants[2].replace(/\s/g, "")).toBe("rgba(153,0,0,1)");
    expect(variants[3].replace(/\s/g, "")).toBe("rgba(134,0,0,1)");
    expect(variants[4].replace(/\s/g, "")).toBe("rgba(115,0,0,1)");
  });
});
