import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/highCharts";
import { showInterventions } from "~/components/utils/timeSeriesData";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

export default (
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  interventions: MaybeRefOrGetter<TimeSeriesIntervention[] | undefined>,
  chart: MaybeRefOrGetter<Highcharts.Chart | undefined>,
) => {
  const interventionPlotBands = computed(() => {
    if (!showInterventions(toValue(timeSeriesMetadata).id)) {
      return;
    }

    const intvns = toValue(interventions);

    if (!intvns) {
      return;
    }
    return intvns.map(intvn => ({
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
    } as Highcharts.AxisPlotBandsOptions));
  });

  watch(interventionPlotBands, (newBands, oldBands) => {
    const xAxis = toValue(chart)?.xAxis[0];

    oldBands?.filter(({ id }) => {
      return !!id && !newBands?.map(n => n.id).includes(id);
    }).forEach(({ id }) => {
      !!id && xAxis?.removePlotBand(id);
    });

    newBands?.forEach((newBand) => {
      if (!oldBands?.map(o => o.id).includes(newBand.id)) {
        xAxis?.addPlotBand(newBand);
      }
    });
  });

  return { interventionPlotBands };
};
