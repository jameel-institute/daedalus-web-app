import type { HSL } from "color-convert";
import { costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioXAxisLabelFormatter, costsChartSingleScenarioTooltip, costsChartStackLabelFormatter, costsChartYAxisTickFormatter, getColorVariants, plotBandsColor, timeSeriesColors } from "~/components/utils/highCharts";
import { CostBasis } from "~/types/unitTypes";
import { mockMetadataResponseData } from "../../mocks/mockResponseData";
import { TypeOfParameter } from "~/types/parameterTypes";

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

describe("single-scenario costs chart tooltip text for stacked column", () => {
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
    const tooltipText = costsChartSingleScenarioTooltip(tooltipPointInstance, CostBasis.USD, 4000);
    expect(tooltipText).toMatch(
      /Life years losses.*\$2.0 billion.*50.0% of 2018 national GDP.*#FF0000.*Working-age adults.*\$999 M.*#00FF00.*Children.*\$0 M/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });

  it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
    const tooltipText = costsChartSingleScenarioTooltip(tooltipPointInstance, CostBasis.PercentGDP, 2_222_222);
    expect(tooltipText).toMatch(
      /Life years losses.*2000%.* of 2018 national GDP.*#FF0000.*Working-age adults.*999%.*#00FF00.*Children.*0%/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });
});

describe("multi-scenario costs chart tooltip text for stacked column", () => {
  const vaccineParam = mockMetadataResponseData.parameters.find(p => p.id === "vaccine");
  const contextInstance = {
    point: {
      category: "High",
      total: undefined,
      points: [{
        color: "#FF0000",
        custom: {
          costAsGdpPercent: 3.820321826248465,
        },
        key: "GDP",
        y: 97364.2025,
      }, {
        color: "#00FF00",
        custom: {
          costAsGdpPercent: 0.10534318554003114,
        },
        key: "Education",
        y: 2684.7621,
      }, {
        color: "#0000FF",
        custom: {
          costAsGdpPercent: 70.05682654902341,
        },
        key: "Life years",
        y: 1785458.7537,
      }],
    },
  };

  it("should return the correct text for the stack's tooltip, when cost basis is USD", () => {
    contextInstance.point.total = 1885507.7183;
    const tooltipText = costsChartMultiScenarioStackedTooltip(contextInstance, CostBasis.USD, vaccineParam);
    expect(tooltipText).toMatch(
      /Global vaccine investment:.*High.*Total losses:.*\$1.9 trillion.*74.0% of 2018 national GDP.*#FF0000.*GDP.*\$97.4 B.*#00FF00.*Education.*\$2.7 B.*#0000FF.*\$1.8 T/,
    );
  });

  it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
    contextInstance.point.total = 73.982491560811;
    contextInstance.point.points[0].y = 3.820321826248465;
    contextInstance.point.points[1].y = 0.10534318554003114;
    contextInstance.point.points[2].y = 70.05682654902341;
    const tooltipText = costsChartMultiScenarioStackedTooltip(contextInstance, CostBasis.PercentGDP, vaccineParam);
    expect(tooltipText).toMatch(
      /Global vaccine investment:.*High.*Total losses:.*74.0%.* of 2018 national GDP.*#FF0000.*GDP.*3.8%.*#00FF00.*Education.*0.1%.*#0000FF.*70.1%/,
    );
  });
});

describe("costsChartStackLabelFormatter", () => {
  it("should return the correct stack label for USD cost basis", () => {
    const label = costsChartStackLabelFormatter(200, CostBasis.USD);
    expect(label).toBe("$200 million");

    const label2 = costsChartStackLabelFormatter(20000000, CostBasis.USD);
    expect(label2).toBe("$20.0 trillion");
  });

  it("should return the correct stack label for percent of GDP cost basis", () => {
    const label = costsChartStackLabelFormatter(20, CostBasis.PercentGDP);
    expect(label).toBe("20.0% of GDP");
  });
});

describe("costsChartLabelFormatter", () => {
  it("should return the correct y-axis tick label for USD cost basis", () => {
    const label = costsChartYAxisTickFormatter(200, CostBasis.USD);
    expect(label).toBe("0 B");
  });

  it("should return the correct y-axis tick label for percent of GDP cost basis", () => {
    const label = costsChartYAxisTickFormatter(20, CostBasis.PercentGDP);
    expect(label).toBe("20%");
  });
});

describe("costsChartMultiScenarioXAxisLabelFormatter", () => {
  it("should return the correct label for a country parameter", () => {
    const axisParam = {
      id: "country",
      label: "Country",
      parameterType: TypeOfParameter.GlobeSelect,
      options: [
        { id: "USA", label: "United States" },
        { id: "CAN", label: "Canada" },
      ],
      ordered: false,
    };

    const label = costsChartMultiScenarioXAxisLabelFormatter("USA", axisParam);
    expect(label).toContain('<span class="fi fi-us" style="width: 1.2rem; height: 1.2rem"></span>');
    expect(label).toContain("United States");
  });

  it("should return the correct label for a non-country parameter", () => {
    const axisParam = {
      id: "vaccine",
      label: "Vaccine",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "high", label: "High" },
        { id: "medium", label: "Medium" },
      ],
      ordered: false,
    };

    const label = costsChartMultiScenarioXAxisLabelFormatter("high", axisParam);
    expect(label).toContain("High");
  });
});

describe("getColorVariants", () => {
  it("creates a range of N colors from a base color", () => {
    const baseColor = { name: "Red", rgb: "not used by util", hsl: [0, 100, 50] as HSL };
    const variants = getColorVariants(baseColor, 5);
    expect(variants).toHaveLength(5);
    expect(variants[0].replace(/\s/g, "")).toBe("rgba(255,64,64,1)");
    expect(variants[1].replace(/\s/g, "")).toBe("rgba(255,32,32,1)");
    expect(variants[2].replace(/\s/g, "")).toBe("rgba(255,0,0,1)");
    expect(variants[3].replace(/\s/g, "")).toBe("rgba(223,0,0,1)");
    expect(variants[4].replace(/\s/g, "")).toBe("rgba(191,0,0,1)");
  });
});
