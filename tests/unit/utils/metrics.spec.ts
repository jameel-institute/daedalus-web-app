import { getValueFromCost, LIFE_YEARS_METRIC, USD_METRIC } from "~/utils/metrics";
import type { ScenarioCost } from "~/types/resultTypes";

const costWithBothMetrics: ScenarioCost = {
  id: "life_years",
  values: [
    { metric: USD_METRIC, value: 1000 },
    { metric: LIFE_YEARS_METRIC, value: 500 },
  ],
};

const costWithUsdOnly: ScenarioCost = {
  id: "gdp",
  values: [
    { metric: USD_METRIC, value: 2500 },
  ],
};

describe("getValueFromCost", () => {
  it("returns the USD value for the USD metric", () => {
    expect(getValueFromCost(costWithBothMetrics, USD_METRIC)).toBe(1000);
  });

  it("returns the life years value for the life years metric", () => {
    expect(getValueFromCost(costWithBothMetrics, LIFE_YEARS_METRIC)).toBe(500);
  });

  it("returns the value when only one metric is present", () => {
    expect(getValueFromCost(costWithUsdOnly, USD_METRIC)).toBe(2500);
  });

  it("returns undefined when the metric is not found in the cost's values", () => {
    expect(getValueFromCost(costWithUsdOnly, LIFE_YEARS_METRIC)).toBeUndefined();
  });

  it("returns undefined when the cost is undefined", () => {
    expect(getValueFromCost(undefined, USD_METRIC)).toBeUndefined();
  });

  it("returns undefined when the cost values array is empty", () => {
    const emptyCost: ScenarioCost = { id: "test", values: [] };
    expect(getValueFromCost(emptyCost, USD_METRIC)).toBeUndefined();
  });
});
