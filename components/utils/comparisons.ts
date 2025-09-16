import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { humanReadableInteger } from "./formatters";

// The minimum number of scenarios that a comparison can have, excluding the baseline.
export const MIN_SCENARIOS_COMPARED_TO_BASELINE = 1;
// The maximum number of scenarios that a comparison can have, excluding the baseline.
export const MAX_SCENARIOS_COMPARED_TO_BASELINE = 4;

// A short name for referring to a scenario in the context of a comparison.
export const getScenarioLabel = (category: string | undefined, axisParam: Parameter | undefined): string => {
  if (axisParam?.parameterType === TypeOfParameter.Numeric) {
    return humanReadableInteger(category);
  } else {
    return axisParam?.options?.find(o => o.id === category)?.label || "";
  }
};
