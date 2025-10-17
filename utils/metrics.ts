import type { ScenarioCost } from "~/types/resultTypes";

export const USD_METRIC = "usd_millions";

export const getDollarValueFromCost = (cost: ScenarioCost | undefined) => {
  return cost?.values.find(c => c.metric === USD_METRIC)?.value;
};
