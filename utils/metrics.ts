import type { ScenarioCost } from "~/types/resultTypes";

export const USD_METRIC = "usd_millions" as const;
export const LIFE_YEARS_METRIC = "life_years" as const;

export const METRICS = [USD_METRIC, LIFE_YEARS_METRIC] as const;

export type Metric = typeof METRICS[number];

export const getValueFromCost = (cost: ScenarioCost | undefined, metricId: Metric) => {
  return cost?.values.find(c => c.metric === metricId)?.value;
};
