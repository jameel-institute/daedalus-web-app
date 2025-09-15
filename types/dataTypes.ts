import type { ScenarioIntervention } from "./resultTypes";

export type TimeSeriesDataPoint = [number, number];

export type TimeSeriesIntervention = ScenarioIntervention & {
  color: string
  label: string
};
