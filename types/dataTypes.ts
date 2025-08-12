import type { ScenarioIntervention } from "./resultTypes";

export type TimeSeriesDataPoint = [number, number];

export type TimeSeriesIntervention = ScenarioIntervention & {
  id: string
  color: string
  label: string
};
