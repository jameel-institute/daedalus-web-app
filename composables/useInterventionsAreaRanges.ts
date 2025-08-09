import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/highCharts";
import type { TimeSeriesIntervention } from "~/types/dataTypes";
import type { SeriesArearangeOptions } from "highcharts";
import type { DisplayInfo } from "~/types/apiResponseTypes";

export default (
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  interventions: MaybeRefOrGetter<Array<TimeSeriesIntervention> | undefined>,
) => {
  const showInterventions = computed(() => {
    // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
    return Number(toValue(interventions)?.length) > 0
      && ["hospitalised", "new_hospitalised", "prevalence", "new_infected"].includes(toValue(timeSeriesMetadata).id);
  });

  const interventionsAreaRangeSeries = computed(() => {
    if (!showInterventions.value) {
      return [];
    }

    return toValue(interventions)?.map((intervention, index) => {
      return {
        type: "arearange",
        color: addAlphaToRgb(intervention.color, plotBandsRgbAlpha),
        data: [{
          x: intervention.start,
          low: index,
          high: index + 1,
        }, {
          x: intervention.end,
          low: index,
          high: index + 1,
        }],
        enableMouseTracking: false, // prevents tooltips
        marker: {
          enabled: false,
        },
        states: {
          inactive: {
            enabled: false,
          },
        },
        custom: {
          synchronized: false,
          id: `intervention${index}`,
        },
      };
    }).filter(x => !!x) as SeriesArearangeOptions[];
  });

  const interventionsYAxisOptions = computed(() => ({
    alignTicks: false,
    gridLineWidth: 0,
    title: {
      text: "",
    },
    labels: {
      enabled: false,
    },
    min: 0,
    max: toValue(interventions)?.length, // Stretches the area ranges to fit the full height of the chart,
  }));

  return { interventionsAreaRangeSeries, interventionsYAxisOptions };
};
