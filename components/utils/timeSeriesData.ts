import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import type { Scenario } from "~/types/storeTypes";

export const getTimeSeriesDataPoints = (scenario: Scenario, seriesId: string): TimeSeriesDataPoint[] => {
  const timeSeriesData = scenario.result.data?.time_series[seriesId];
  // Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
  return timeSeriesData?.map((value, i) => [i + 1, value]) || [];
};
