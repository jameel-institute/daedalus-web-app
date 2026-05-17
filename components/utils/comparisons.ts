import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { commaSeparatedNumber } from "./formatters";
import type { ScenarioCost } from "~/types/resultTypes";

// The minimum number of scenarios that a comparison can have, excluding the baseline.
export const MIN_SCENARIOS_COMPARED_TO_BASELINE = 1;
// The maximum number of scenarios that a comparison can have, excluding the baseline.
export const MAX_SCENARIOS_COMPARED_TO_BASELINE = 5;

// A short name for referring to a scenario in the context of a comparison.
export const getScenarioLabel = (category: string | undefined, axisParam: Parameter | undefined): string => {
  if (axisParam?.parameterType === TypeOfParameter.Numeric) {
    return commaSeparatedNumber(category);
  } else {
    return axisParam?.options?.find(o => o.id === category)?.label || "";
  }
};

// Get the difference in USD for a given cost (on some scenario) vs the matching cost on the baseline scenario.
export const diffAgainstBaseline = (cost: ScenarioCost, metric: Metric) => {
  const appStore = useAppStore();
  if (!appStore.baselineScenario) {
    return;
  }
  const matchingCostFromBaseline = appStore.getScenarioCostById(appStore.baselineScenario, cost.id);
  if (metric === LIFE_YEARS_METRIC) {
    const baselineLifeYears = getValueFromCost(matchingCostFromBaseline, metric);
    const subCostLifeYears = getValueFromCost(cost, metric);
    if (baselineLifeYears !== undefined && subCostLifeYears !== undefined) {
      return subCostLifeYears - baselineLifeYears;
    }
  } else {
    const baselineCostDollarAmount = getValueFromCost(matchingCostFromBaseline, metric);
    const subCostDollarAmount = getValueFromCost(cost, metric);
    if (subCostDollarAmount !== undefined && baselineCostDollarAmount !== undefined) {
      return subCostDollarAmount - baselineCostDollarAmount;
    };
  };
};
