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
  const totalNode = {
    name: "Total",
    value: 1_211,
    parent: "",
    index: 0,
    node: {
      i: 0,
      name: "Total",
      parentNode: { name: "", i: -1 },
    },
  };
  const lifeYearsNode = {
    name: "Life years",
    value: 999,
    parent: "total",
    index: 1,
    node: {
      i: 1,
      name: "Life years",
      parentNode: totalNode.node,
    },
  };
  const workingAgeAdultsNode = {
    name: "Working-age adults",
    value: 222.222,
    parent: "life_years",
    index: 2,
    node: {
      i: 2,
      name: "Working-age adults",
      parentNode: lifeYearsNode.node,
    },
  };

  it("should return the correct text for the top-level ('Total') tooltip", () => {
    expect(costsPieTooltipText(totalNode)).toBe(
      `<b>Total</b><br/>\n$1.2 billion<br/>\nX.Y% of national GDP`,
    );
  });

  it("should return the correct text for the direct children of the top-level ('Total') tooltip", () => {
    expect(costsPieTooltipText(lifeYearsNode)).toBe(
      `<b>Life years</b><br/>\n$999.0 million<br/>\nX.Y% of national GDP`,
    );
  });

  it("should return the correct text for the grand-children of the top-level ('Total') tooltip", () => {
    expect(costsPieTooltipText(workingAgeAdultsNode)).toBe(
      `<b>Life years: Working-age adults</b><br/>\n$222.2 million<br/>\nX.Y% of national GDP`,
    );
  });
});
