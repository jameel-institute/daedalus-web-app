import { addAlphaToRgb, plotBandsRgbAlpha } from "~/components/utils/timeSeriesCharts";
import { showInterventions } from "~/components/utils/timeSeriesData";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

export default (
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  interventions: MaybeRefOrGetter<TimeSeriesIntervention[] | undefined>,
  xAxis: MaybeRefOrGetter<Highcharts.Axis | undefined>,
  toggleContextMenuButton: (on: boolean) => void,
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

    newBands?.filter((newBand) => {
      return !oldBands?.map(o => o.id).includes(newBand.id);
    }).forEach((newBand) => {
      toValue(xAxis)?.addPlotBand(newBand);
    });

    const someLabelsExisted = oldBands.some(b => !!b.label?.text);
    const someLabelsExistNow = newBands.some(b => !!b.label?.text);
    // Only trigger the chart to update when necessary, since a full re-draw is expensive.
    if (someLabelsExisted !== someLabelsExistNow) {
      toggleContextMenuButton(!someLabelsExistNow);
    }
  });

  return { initialInterventionsPlotBands: interventionsPlotBands.value };
};
