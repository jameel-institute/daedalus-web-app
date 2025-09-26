import { costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioXAxisLabelFormatter, costsChartPalette, costsChartSingleScenarioTooltip, costsChartStackLabelFormatter, costsChartYAxisTickFormatter } from "~/components/utils/costCharts";
import { CostBasis } from "~/types/unitTypes";
import { mockMetadataResponseData } from "../../mocks/mockResponseData";
import { TypeOfParameter } from "~/types/parameterTypes";

describe("costsChartPalette", () => {
  it("should be 3 colors long", () => {
    expect(costsChartPalette).toHaveLength(3);
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
      /Life years losses.*\$2.0 billion.*USD.*50.0% of pre-pandemic GDP.*#FF0000.*Working-age adults.*\$999 M.*#00FF00.*Children.*\$0 M/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });

  it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
    const tooltipText = costsChartSingleScenarioTooltip(tooltipPointInstance, CostBasis.PercentGDP, 2_222_222);
    expect(tooltipText).toMatch(
      /Life years losses.*2000%.* of pre-pandemic GDP.*#FF0000.*Working-age adults.*999%.*#00FF00.*Children.*0%/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });
});

describe("multi-scenario costs chart tooltip text for stacked column", () => {
  const contextInstance = {
    point: {
      category: undefined,
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

  describe("when the axis parameter is not numeric", () => {
    const context = structuredClone(contextInstance);
    const vaccineParam = mockMetadataResponseData.parameters.find(p => p.id === "vaccine");

    it("should return the correct text for the stack's tooltip, when cost basis is USD", () => {
      context.point.category = "high";
      context.point.total = 1885507.7183;
      const tooltipText = costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, vaccineParam);
      expect(tooltipText).toMatch(
        /Global vaccine investment:.*High.*Total losses:.*\$1.9 trillion.*USD.*74.0% of pre-pandemic GDP.*#FF0000.*GDP.*\$97.4 B.*#00FF00.*Education.*\$2.7 B.*#0000FF.*\$1.8 T/,
      );
    });

    it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
      context.point.category = "high";
      context.point.total = 73.982491560811;
      context.point.points[0].y = 3.820321826248465;
      context.point.points[1].y = 0.10534318554003114;
      context.point.points[2].y = 70.05682654902341;
      const tooltipText = costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, vaccineParam);
      expect(tooltipText).toMatch(
        /Global vaccine investment:.*High.*Total losses:.*74.0%.* of pre-pandemic GDP.*#FF0000.*GDP.*3.8%.*#00FF00.*Education.*0.1%.*#0000FF.*70.1%/,
      );
    });
  });

  describe("when the axis parameter is numeric", () => {
    const context = structuredClone(contextInstance);
    const hospitalCapacityParam = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity");

    it("should return the correct text for the stack's tooltip, when cost basis is USD", () => {
      context.point.category = "12345";
      context.point.total = 1885507.7183;
      const tooltipText = costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, hospitalCapacityParam);
      expect(tooltipText).toMatch(
        /Hospital surge capacity:.*12,345.*Total losses:.*\$1.9 trillion.*USD.*74.0% of pre-pandemic GDP.*#FF0000.*GDP.*\$97.4 B.*#00FF00.*Education.*\$2.7 B.*#0000FF.*\$1.8 T/,
      );
    });

    it("should return the correct text for the stack's tooltip, when cost basis is percent of GDP", () => {
      context.point.category = "12345";
      context.point.total = 73.982491560811;
      context.point.points[0].y = 3.820321826248465;
      context.point.points[1].y = 0.10534318554003114;
      context.point.points[2].y = 70.05682654902341;
      const tooltipText = costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, hospitalCapacityParam);
      expect(tooltipText).toMatch(
        /Hospital surge capacity:.*12,345.*Total losses:.*74.0%.* of pre-pandemic GDP.*#FF0000.*GDP.*3.8%.*#00FF00.*Education.*0.1%.*#0000FF.*70.1%/,
      );
    });
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
  it("should return the correct label for a (non-baseline) country parameter", () => {
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

    const label = costsChartMultiScenarioXAxisLabelFormatter("USA", axisParam, "CAN");
    expect(label).toContain("fi-us");
    expect(label).toContain("United States");
    expect(label).not.toContain("baseline");
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

    const label = costsChartMultiScenarioXAxisLabelFormatter("high", axisParam, "medium");
    expect(label).toContain("High");
    expect(label).not.toContain("fi");
    expect(label).not.toContain("baseline");
  });

  it("should return the correct label for a numeric parameter", () => {
    const axisParam = {
      id: "hospital_capacity",
      label: "Hospital Capacity",
      parameterType: TypeOfParameter.Numeric,
      options: [],
      ordered: false,
    };

    const label = costsChartMultiScenarioXAxisLabelFormatter("12345", axisParam, "999");
    expect(label).toContain("12,345");
    expect(label).not.toContain("fi");
    expect(label).not.toContain("baseline");
  });

  it("should return the correct label for a baseline scenario", () => {
    const axisParam = {
      id: "vaccine",
      label: "Vaccine",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "high", label: "High" },
        { id: "low", label: "Low" },
      ],
      ordered: false,
    };

    const label = costsChartMultiScenarioXAxisLabelFormatter("high", axisParam, "high");
    expect(label).toContain("High");
    expect(label).toContain("(baseline)");
    expect(label).not.toContain("fi");
  });

  it("should return the correct label for a non-baseline scenario", () => {
    const axisParam = {
      id: "vaccine",
      label: "Vaccine",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "high", label: "High" },
        { id: "low", label: "Low" },
      ],
      ordered: false,
    };

    const label = costsChartMultiScenarioXAxisLabelFormatter("high", axisParam, "low");
    expect(label).toContain("High");
    expect(label).not.toContain("fi");
    expect(label).not.toContain("baseline");
  });

  it("should return the correct label for a baseline country scenario", () => {
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

    const label = costsChartMultiScenarioXAxisLabelFormatter("USA", axisParam, "USA");
    expect(label).toContain("fi-us");
    expect(label).toContain("United States");
    expect(label).toContain("(baseline)");
  });
});
