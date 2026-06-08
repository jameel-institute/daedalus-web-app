import { commaSeparatedNumber } from "~/components/utils/formatters";
import { plotLinesColor, plotLinesWidthPx, timeSeriesColors } from "~/components/Charts/utils/timeSeriesCharts";
import type { Scenario } from "~/types/storeTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  yAxis: MaybeRefOrGetter<Highcharts.Axis | undefined>,
  scenarios: MaybeRefOrGetter<Scenario[]>,
) => {
  const appStore = useAppStore();

  // A flat map of each scenario's capacities.
  // For each capacity on each scenario result, merge in some extra info we need to render the plotLines:
  // (1) a color (matching the scenario's time-series color) in case we need one for distinguishing multiple plotLines,
  // (2) the scenario runId which allows us to have a unique id for each plot line, and
  // (3) a label derived from result metadata.
  const capacities = computed(() => {
    if (!toValue(showCapacities)) {
      return [];
    }

    const caps: Array<{ id: string, value: number, runId: string, color: string, label: string }> = [];
    const scens = toValue(scenarios);
    scens.forEach(({ result, runId }, index) => {
      if (!runId) {
        return;
      }
      const color = scens.length === 1 ? plotLinesColor : timeSeriesColors[index % timeSeriesColors.length];
      result.data?.capacities.forEach((c) => {
        const metadataLabel = appStore.metadata?.results.capacities.find(({ id }) => c.id === id)?.label;
        const label = `${metadataLabel}: ${commaSeparatedNumber(c.value.toString())}`;
        caps.push({ ...c, runId, color, label });
      });
    });
    return caps;
  });

  // Convert capacity data to plotLine format
  const capacitiesPlotLines = computed((): Array<Highcharts.AxisPlotLinesOptions> => capacities.value.map(c => ({
    color: c.color,
    label: {
      text: capacities.value.length === 1 ? c.label : "",
      style: {
        color: c.color,
      },
      align: "middle",
    },
    dashStyle: "ShortDot",
    width: plotLinesWidthPx,
    value: c.value,
    zIndex: 4, // Render label in front of the series line
    id: `${c.id}-${c.value}-${c.runId}`, // Ensure unique id for plot line
  })));

  // The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
  // to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
  // plotLines remain visible even when the maximum data value is less than the maximum plotLine value.
  const minRange = computed(() => {
    if (capacities.value?.length) {
      return capacities.value.reduce((acc, { value }) => Math.max(acc, value), 0);
    }
  });

  watch(capacitiesPlotLines, (newLines, oldLines) => {
    oldLines?.filter(({ id }) => {
      return !!id && !newLines?.map(n => n.id).includes(id);
    }).forEach(({ id }) => {
      !!id && toValue(yAxis)?.removePlotLine(id);
    });

    newLines?.forEach((newLine) => {
      if (!oldLines?.map(o => o.id).includes(newLine.id)) {
        toValue(yAxis)?.addPlotLine(newLine);
      }
    });
  });

  watch(minRange, (newMinRange) => {
    if (toValue(yAxis)?.options?.minRange !== newMinRange) {
      toValue(yAxis)?.update({ minRange: newMinRange });
    };
  });

  return {
    initialCapacitiesPlotLines: capacitiesPlotLines.value,
    initialMinRange: minRange.value,
  };
};
