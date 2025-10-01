import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import type { Scenario } from "~/types/storeTypes";

export const getTimeSeriesDataPoints = (scenario: Scenario, seriesId: string): TimeSeriesDataPoint[] => {
  const timeSeriesData = scenario.result.data?.time_series[seriesId];

  // Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
  return timeSeriesData?.map((value, i) => [i + 1, value]) || [];
};

// TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
export const timeSeriesYUnits = (seriesId: string): string => {
  switch (seriesId) {
    case "prevalence":
      return "cases";
    case "new_infected":
      return "new cases";
    case "hospitalised":
      return "in need of hospitalisation";
    case "new_hospitalised":
      return "new hospitalisations needed";
    case "dead":
      return "deaths";
    case "new_dead":
      return "new deaths";
    case "vaccinated":
      return "vaccinated";
    case "new_vaccinated":
      return "new vaccinations";
    default:
      return "cases";
  }
};

export const responseInterventionId = "response";

// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
export const showInterventions = (seriesId: string): boolean => {
  return ["hospitalised", "new_hospitalised", "prevalence", "new_infected"].includes(seriesId);
};

// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
export const showCapacities = (seriesId: string | undefined): boolean => {
  return seriesId === "hospitalised";
};
