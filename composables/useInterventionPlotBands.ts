import { addAlphaToRgb, plotBandsDefaultColor, plotBandsRgbAlpha, timeSeriesColors } from "~/components/utils/timeSeriesCharts";
import { responseInterventionId, showInterventions } from "~/components/utils/timeSeriesData";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { Scenario } from "~/types/storeTypes";

export default (
  synchPoint: MaybeRefOrGetter<Highcharts.Point | undefined>,
  timeSeriesMetadata: MaybeRefOrGetter<DisplayInfo>,
  xAxis: MaybeRefOrGetter<Highcharts.Axis | undefined>,
  toggleContextMenuButton: (on: boolean) => void,
  scenario: MaybeRefOrGetter<Scenario | undefined>,
) => {
  const appStore = useAppStore();

  const interventions = computed(() =>
    toValue(scenario)?.result.data?.interventions.filter(({ id }) => id === responseInterventionId));

  const interventionsPlotBands = computed(() => {
    if (!showInterventions(toValue(timeSeriesMetadata).id) || !interventions.value) {
      return [];
    }

    // The chart being hovered may be one that doesn't show interventions. If so, we don't need to update any chart's plot bands.
    const hoveredChartShowsInterventions = toValue(synchPoint)?.series?.options?.custom?.showInterventions === true;
    const hoveredChartExistsAndShowsInterventions = !!toValue(synchPoint) && hoveredChartShowsInterventions;
    const scenarioIndexInComparison = appStore.currentComparison.scenarios.findIndex(s => s.runId === toValue(scenario)?.runId);
    const inComparisonMode = scenarioIndexInComparison !== -1;

    return interventions.value.map(({ start, end }) => {
      const color = inComparisonMode
        ? timeSeriesColors[scenarioIndexInComparison % timeSeriesColors.length]
        : plotBandsDefaultColor;

      // unique id lets Highcharts track individual plot bands for removePlotBand and addPlotBand
      return {
        id: `${toValue(scenario)?.runId}-${start}-${end}-${hoveredChartExistsAndShowsInterventions}`,
        from: Number(start.toFixed(0)),
        to: Number(end.toFixed(0)),
        color: addAlphaToRgb(color, plotBandsRgbAlpha),
        label: {
          text: hoveredChartExistsAndShowsInterventions ? `Intervention days ${start.toFixed(0)}–${end.toFixed(0)}` : "",
          align: "center",
          inside: false,
          verticalAlign: "top",
          style: {
            color,
            fontSize: "0.7em",
          },
          y: -5, // Label above plot band
        },
      } as Highcharts.AxisPlotBandsOptions;
    });
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
