import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/highCharts";
import { showInterventions } from "~/components/utils/timeSeriesData";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

export default (
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  intervention: MaybeRefOrGetter<TimeSeriesIntervention | undefined>,
  chart: MaybeRefOrGetter<Highcharts.Chart | undefined>,
) => {
  const interventionPlotBand = computed(() => {
    if (!showInterventions(toValue(timeSeriesMetadata).id)) {
      return;
    }

    const intvn = toValue(intervention);

    if (!intvn) {
      return;
    }
    return {
      id: intvn.id,
      from: Number(intvn.start.toFixed(0)),
      to: Number(intvn.end.toFixed(0)),
      color: addAlphaToRgb(intvn.color, plotBandsRgbAlpha),
      label: {
        text: intvn.label,
        align: "center",
        inside: false,
        verticalAlign: "top",
        style: {
          color: intvn.color,
          fontSize: "0.7em",
        },
        y: -5, // Label above plot band
      },
    } as Highcharts.AxisPlotBandsOptions;
  });

  watch(interventionPlotBand, (newPlotBand, oldPlotBand) => {
    const xAxis = toValue(chart)?.xAxis[0];
    if (oldPlotBand?.id && oldPlotBand?.id !== newPlotBand?.id) {
      xAxis?.removePlotBand(oldPlotBand.id);
    }

    if (newPlotBand && oldPlotBand?.id !== newPlotBand?.id) {
      xAxis?.addPlotBand(newPlotBand);
    }
  });

  return { interventionPlotBand };
};
