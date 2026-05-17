import type { ScenarioCost } from "~/types/resultTypes";

export const USD_METRIC = "usd_millions";
export const LIFE_YEARS_METRIC = "life_years";

export type Metric = "usd_millions" | "life_years";

export const getValueFromCost = (cost: ScenarioCost | undefined, metricId: Metric) => {
  return cost?.values.find(c => c.metric === metricId)?.value;
};
