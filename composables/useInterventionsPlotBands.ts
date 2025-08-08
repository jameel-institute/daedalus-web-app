import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/highCharts";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

export default (
  showInterventions: MaybeRefOrGetter<boolean>,
  interventions: MaybeRefOrGetter<Array<TimeSeriesIntervention> | undefined>,
) => {
  const interventionsPlotBands = computed(() => {
    if (!toValue(showInterventions)) {
      return [];
    }

    return toValue(interventions)?.map(({ start, end, color }) => {
      return {
        from: start,
        to: end,
        color: addAlphaToRgb(color, plotBandsRgbAlpha),
      } as Highcharts.AxisPlotBandsOptions;
    });
  });

  return { interventionsPlotBands };
};
