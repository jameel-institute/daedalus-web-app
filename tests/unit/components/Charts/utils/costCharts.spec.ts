import { CostBasis } from "~/types/unitTypes";
import { mockMetadataResponseData } from "../../../mocks/mockResponseData";
import { type Parameter, type ParameterOption, TypeOfParameter } from "~/types/parameterTypes";
import { costsChartPalette, costsChartYAxisTickFormatter } from "~/components/Charts/utils/costCharts";
import { costsChartSingleScenarioStackLabelFormatter, costsChartSingleScenarioTooltip } from "~/components/Charts/utils/singleScenarioCostCharts";
import { costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioStackLabelFormatter, costsChartMultiScenarioXAxisLabelFormatter } from "~/components/Charts/Compare/utils/multiScenarioCostCharts";

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
      /Life years losses.*2,000%.* of pre-pandemic GDP.*#FF0000.*Working-age adults.*999%.*#00FF00.*Children.*0%/,
    );
    expect(tooltipText).not.toMatch(/Do not include in tooltips/i);
  });
});

describe("multi-scenario costs chart tooltip text for stacked column", () => {
  const contextInstance = {
    point: {
      category: "",
      custom: { stackNetTotal: 0 },
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
  const notDiffingHeader = "Total losses";
  const diffingHeader = "Net losses relative to baseline";
  const conversionToGdpPercent = "74.0% of pre-pandemic GDP"; // Calculated from sum of the three point custom.costAsGdpPercent values
  const multiScenarioStackedTooltipMatcher = (
    param: Parameter,
    paramOption: ParameterOption,
    header: string,
    includeMetricConversion: boolean,
    total: { color: string, text: string, isNegative?: boolean },
    gdpSubtotal: { color: string, text: string, isNegative?: boolean },
    educationSubtotal: { color: string, text: string, isNegative?: boolean },
    lifeYearsSubtotal: { color: string, text: string, isNegative?: boolean },
  ) => {
    return new RegExp(
      `${param?.label}:.*${paramOption.label}.*${header}:.*`
      + `color: ${total.color}\">${total.isNegative ? "-" : ""}${total.text}.*`
      + `${includeMetricConversion ? conversionToGdpPercent : ""}.*`
      + `#FF0000.*GDP.*color: ${gdpSubtotal.color}\">${gdpSubtotal.isNegative ? "-" : ""}${gdpSubtotal.text}.*`
      + `#00FF00.*Education.*color: ${educationSubtotal.color}\">${educationSubtotal.isNegative ? "-" : ""}${educationSubtotal.text}.*`
      + `#0000FF.*Life years.*color: ${lifeYearsSubtotal.color}\">${lifeYearsSubtotal.isNegative ? "-" : ""}${lifeYearsSubtotal.text}`,
    );
  };

  describe("when the axis parameter is not numeric", () => {
    const context = structuredClone(contextInstance);
    const vaccineParam = mockMetadataResponseData.parameters.find(p => p.id === "vaccine")!;
    context.point.category = "high";
    const highOption = vaccineParam.options!.find(o => o.id === context.point.category)!;

    describe("when cost basis is USD", () => {
      it("should return the correct text for the stack's tooltip, when chart is NOT diffing", () => {
        context.point.custom = { stackNetTotal: 1885507.7183 };
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, vaccineParam, false),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            vaccineParam,
            highOption,
            notDiffingHeader,
            true,
            { color: "inherit", text: "\\$1.9 trillion.*USD" },
            { color: "inherit", text: "\\$97.4 B" },
            { color: "inherit", text: "\\$2.7 B" },
            { color: "inherit", text: "\\$1.8 T" },
          ),
        );
      });

      it("should return the correct text for the stack's tooltip, when chart IS diffing", () => {
        context.point.custom = { stackNetTotal: -1885507.7183 };
        context.point.points[0].y = -97364.2025;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, vaccineParam, true),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            vaccineParam,
            highOption,
            diffingHeader,
            true,
            { color: "darkgreen", text: "\\$1.9 trillion.*USD", isNegative: true },
            { color: "darkgreen", text: "\\$97.4 B", isNegative: true },
            { color: "darkred", text: "\\$2.7 B" },
            { color: "darkred", text: "\\$1.8 T" },
          ),
        );
      });
    });

    describe("when cost basis is percent of GDP", () => {
      it("should return the correct text for the stack's tooltip, when chart is NOT diffing", () => {
        context.point.custom = { stackNetTotal: 73.982491560811 };
        context.point.points[0].y = 3.820321826248465;
        context.point.points[1].y = 0.10534318554003114;
        context.point.points[2].y = 70.05682654902341;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, vaccineParam, false),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            vaccineParam,
            highOption,
            notDiffingHeader,
            false,
            { color: "inherit", text: "74.0%.* of pre-pandemic GDP" },
            { color: "inherit", text: "3.8%" },
            { color: "inherit", text: "0.1%" },
            { color: "inherit", text: "70.1%" },
          ),
        );
      });

      it("should return the correct text for the stack's tooltip, when chart IS diffing", () => {
        context.point.custom = { stackNetTotal: -73.982491560811 };
        context.point.points[0].y = -3.820321826248465;
        context.point.points[1].y = 0.10534318554003114;
        context.point.points[2].y = 70.05682654902341;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, vaccineParam, true),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            vaccineParam,
            highOption,
            diffingHeader,
            false,
            { color: "darkgreen", text: "74.0%.* of pre-pandemic GDP", isNegative: true },
            { color: "darkgreen", text: "3.8%", isNegative: true },
            { color: "darkred", text: "0.1%" },
            { color: "darkred", text: "70.1%" },
          ),
        );
      });
    });
  });

  describe("when the axis parameter is numeric", () => {
    const context = structuredClone(contextInstance);
    const hospitalCapacityParam = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity") as Parameter;
    context.point.category = "12345";
    const hospitalParamOption = { id: context.point.category, label: "12,345" };

    describe("when cost basis is USD", () => {
      it("should return the correct text for the stack's tooltip, when chart is NOT diffing", () => {
        context.point.custom = { stackNetTotal: 1885507.7183 };
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, hospitalCapacityParam, false),
        ).toMatch(multiScenarioStackedTooltipMatcher(
          hospitalCapacityParam,
          hospitalParamOption,
          notDiffingHeader,
          true,
          { color: "inherit", text: "\\$1.9 trillion.*USD" },
          { color: "inherit", text: "\\$97.4 B" },
          { color: "inherit", text: "\\$2.7 B" },
          { color: "inherit", text: "\\$1.8 T" },
        ));
      });

      it("should return the correct text for the stack's tooltip, when chart IS diffing", () => {
        context.point.custom = { stackNetTotal: -1885507.7183 };
        context.point.points[0].y = -97364.2025;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.USD, hospitalCapacityParam, true),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            hospitalCapacityParam,
            hospitalParamOption,
            diffingHeader,
            true,
            { color: "darkgreen", text: "\\$1.9 trillion.*USD", isNegative: true },
            { color: "darkgreen", text: "\\$97.4 B", isNegative: true },
            { color: "darkred", text: "\\$2.7 B" },
            { color: "darkred", text: "\\$1.8 T" },
          ),
        );
      });
    });

    describe("when cost basis is percent of GDP", () => {
      it("should return the correct text for the stack's tooltip, when chart is NOT diffing", () => {
        context.point.custom = { stackNetTotal: 73.982491560811 };
        context.point.points[0].y = 3.820321826248465;
        context.point.points[1].y = 0.10534318554003114;
        context.point.points[2].y = 70.05682654902341;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, hospitalCapacityParam, false),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            hospitalCapacityParam,
            hospitalParamOption,
            notDiffingHeader,
            false,
            { color: "inherit", text: "74.0%.* of pre-pandemic GDP" },
            { color: "inherit", text: "3.8%" },
            { color: "inherit", text: "0.1%" },
            { color: "inherit", text: "70.1%" },
          ),
        );
      });

      it("should return the correct text for the stack's tooltip, when chart IS diffing", () => {
        context.point.custom = { stackNetTotal: -7300.982491560811 };
        context.point.points[0].y = -3.820321826248465;
        context.point.points[1].y = 0.10534318554003114;
        context.point.points[2].y = 7000.056826549023;
        expect(
          costsChartMultiScenarioStackedTooltip(context, CostBasis.PercentGDP, hospitalCapacityParam, true),
        ).toMatch(
          multiScenarioStackedTooltipMatcher(
            hospitalCapacityParam,
            hospitalParamOption,
            diffingHeader,
            false,
            { color: "darkgreen", text: "7,301.0%.* of pre-pandemic GDP", isNegative: true },
            { color: "darkgreen", text: "3.8%", isNegative: true },
            { color: "darkred", text: "0.1%" },
            { color: "darkred", text: "7,000%" },
          ),
        );
      });
    });
  });
});

describe("costsChartSingleScenarioStackLabelFormatter", () => {
  it("should return the correct stack label for USD cost basis", () => {
    const label = costsChartSingleScenarioStackLabelFormatter(200, CostBasis.USD);
    expect(label).toBe("$200 million");

    const label2 = costsChartSingleScenarioStackLabelFormatter(20000000, CostBasis.USD);
    expect(label2).toBe("$20.0 trillion");
  });

  it("should return the correct stack label for percent of GDP cost basis", () => {
    const label = costsChartSingleScenarioStackLabelFormatter(20, CostBasis.PercentGDP);
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
    expect(label).not.toContain("bold");
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
    expect(label).not.toContain("bold");
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
    expect(label).not.toContain("bold");
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
    expect(label).toContain("bold");
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
    expect(label).not.toContain("bold");
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
    expect(label).toContain("bold");
  });
});

describe("costsChartMultiScenarioStackLabelFormatter", () => {
  const stackKey = "column,,,";
  const createTestStackItem = (xPositionIndex: number, isNegative: boolean, posTotal?: number, negTotal?: number) => {
    const item = {
      x: xPositionIndex,
      isNegative,
      axis: {
        series: [{ stackKey }],
        stacking: {
          stacks: {},
        },
      },
    };
    if (negTotal !== undefined) {
      item.axis.stacking.stacks[`-${stackKey}`] = { [xPositionIndex]: { total: negTotal } };
    }
    if (posTotal !== undefined) {
      item.axis.stacking.stacks[stackKey] = { [xPositionIndex]: { total: posTotal } };
    }
    return item;
  };

  describe("when cost basis is USD", () => {
    describe("when chart is NOT diffing", () => {
      it("should return the correct label", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(1, false, 2000), CostBasis.USD, false);
        expect(label).toContain("$2.0 B");
        expect(label).toContain("color: inherit");
      });
    });

    describe("when chart IS diffing", () => {
      it("should return the correct labels when both positive and negative stack labels exist, and positive is larger", () => {
        const stackLabelItem = createTestStackItem(2, false, 1500, -500);
        const positiveLabel = costsChartMultiScenarioStackLabelFormatter(stackLabelItem, CostBasis.USD, true);
        expect(positiveLabel).toContain("$1.0 B (net)");
        expect(positiveLabel).toContain("color: darkred");

        const negStackLabelItem = { ...stackLabelItem, isNegative: true };
        const negativeLabel = costsChartMultiScenarioStackLabelFormatter(negStackLabelItem, CostBasis.USD, true);
        expect(negativeLabel).toBeFalsy();
      });

      it("should return the correct label when both positive and negative stack labels exist, and negative is larger", () => {
        const stackLabelItem = createTestStackItem(3, false, 500, -1500);
        const positiveLabel = costsChartMultiScenarioStackLabelFormatter(stackLabelItem, CostBasis.USD, true);
        expect(positiveLabel).toBeFalsy();

        const negStackLabelItem = { ...stackLabelItem, isNegative: true };
        const negativeLabel = costsChartMultiScenarioStackLabelFormatter(negStackLabelItem, CostBasis.USD, true);
        expect(negativeLabel).toContain("-$1.0 B (net)");
        expect(negativeLabel).toContain("color: darkgreen");
      });

      it("should return the correct label when only positive stack label exists", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(4, false, 2000), CostBasis.USD, true);
        expect(label).toContain("$2.0 B");
        expect(label).toContain("color: darkred");
      });

      it("should return the correct label when only negative stack label exists", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(5, true, undefined, -3000), CostBasis.USD, true);
        expect(label).toContain("-$3.0 B");
        expect(label).toContain("color: darkgreen");
      });
    });
  });

  describe("when cost basis is percent of GDP", () => {
    describe("when chart is NOT diffing", () => {
      it("should return the correct label", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(1, false, 20.8123), CostBasis.PercentGDP, false);
        expect(label).toContain("20.8%");
        expect(label).not.toContain("0%");
        expect(label).toContain("inherit");
      });
    });

    describe("when chart IS diffing", () => {
      it("should return the correct label when both positive and negative stack labels exist, and positive is larger", () => {
        const stackLabelItem = createTestStackItem(2, false, 15.5123, -5.2234);
        const positiveLabel = costsChartMultiScenarioStackLabelFormatter(stackLabelItem, CostBasis.PercentGDP, true);
        expect(positiveLabel).toContain("10.3% (net)");
        expect(positiveLabel).toContain("color: darkred");

        const negStackLabelItem = { ...stackLabelItem, isNegative: true };
        const negativeLabel = costsChartMultiScenarioStackLabelFormatter(negStackLabelItem, CostBasis.PercentGDP, true);
        expect(negativeLabel).toBeFalsy();
      });

      it("should return the correct label when both positive and negative stack labels exist, and negative is larger", () => {
        const stackLabelItem = createTestStackItem(3, false, 5.2234, -15.5123);
        const positiveLabel = costsChartMultiScenarioStackLabelFormatter(stackLabelItem, CostBasis.PercentGDP, true);
        expect(positiveLabel).toBeFalsy();

        const negStackLabelItem = { ...stackLabelItem, isNegative: true };
        const negativeLabel = costsChartMultiScenarioStackLabelFormatter(negStackLabelItem, CostBasis.PercentGDP, true);
        expect(negativeLabel).toContain("-10.3% (net)");
        expect(negativeLabel).toContain("color: darkgreen");
      });

      it("should return the correct label when only positive stack label exists", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(4, false, 20.89), CostBasis.PercentGDP, true);
        expect(label).toContain("20.9%");
        expect(label).toContain("color: darkred");
      });

      it("should return the correct label when only negative stack label exists", () => {
        const label = costsChartMultiScenarioStackLabelFormatter(createTestStackItem(5, true, undefined, -30.29), CostBasis.PercentGDP, true);
        expect(label).toContain("-30.3%");
        expect(label).toContain("color: darkgreen");
      });
    });
  });
});
