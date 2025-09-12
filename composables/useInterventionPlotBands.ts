import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/timeSeriesCharts";
import { showInterventions } from "~/components/utils/timeSeriesData";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

export default (
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  interventions: MaybeRefOrGetter<TimeSeriesIntervention[] | undefined>,
  xAxis: MaybeRefOrGetter<Highcharts.Axis | undefined>,
) => {
  const interventionsPlotBands = computed(() => {
    const intvns = toValue(interventions);
    if (!showInterventions(toValue(timeSeriesMetadata).id) || !intvns) {
      return [];
    }

    return intvns.map(({ id, start, end, color, label }) => ({
      id,
      from: Number(start.toFixed(0)),
      to: Number(end.toFixed(0)),
      color: addAlphaToRgb(color, plotBandsRgbAlpha),
      label: {
        text: label,
        align: "center",
        inside: false,
        verticalAlign: "top",
        style: {
          color,
          fontSize: "0.7em",
        },
        y: -5, // Label above plot band
      },
    } as Highcharts.AxisPlotBandsOptions));
  });

  watch(interventionsPlotBands, (newBands, oldBands) => {
    oldBands?.filter(({ id }) => {
      return !!id && !newBands?.map(n => n.id).includes(id);
    }).forEach(({ id }) => {
      !!id && toValue(xAxis)?.removePlotBand(id);
    });

    newBands?.forEach((newBand) => {
      if (!oldBands?.map(o => o.id).includes(newBand.id)) {
        toValue(xAxis)?.addPlotBand(newBand);
      }
    });
  });

  return { initialInterventionsPlotBands: interventionsPlotBands.value };
};
