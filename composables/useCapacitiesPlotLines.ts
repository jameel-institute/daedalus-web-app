import { humanReadableInteger } from "~/components/utils/formatters";
import { plotLinesColor } from "~/components/utils/highCharts";
import type { ScenarioCapacity } from "~/types/resultTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  capacities: MaybeRefOrGetter<Array<ScenarioCapacity> | undefined>,
  chart: MaybeRefOrGetter<Highcharts.Chart | undefined>,
) => {
  const appStore = useAppStore();

  const capacitiesPlotLines = computed(() => {
    if (!toValue(showCapacities) || !toValue(capacities)?.length) {
      return [];
    }

    return toValue(capacities)?.map(({ id, value }) => {
      const capacityLabel = appStore.metadata?.results.capacities
        .find(({ id: capacityId }) => capacityId === id)
        ?.label;

      return {
        color: plotLinesColor,
        label: {
          text: `${capacityLabel}: ${humanReadableInteger(value.toString())}`,
          style: {
            color: plotLinesColor,
          },
          align: "middle",
        },
        width: 2,
        value,
        zIndex: 4, // Render label in front of the series line
        id: `${id}-${value.toString()}`,
      };
    }) as Array<Highcharts.AxisPlotLinesOptions>;
  });

  // The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
  // to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
  // plotLines remain visible even when the maximum data value is less than the maximum plotLine value.
  const minRange = computed(() => {
    const caps = toValue(capacities);
    if (toValue(showCapacities) && caps?.length) {
      return caps.reduce((acc, { value }) => Math.max(acc, value), 0);
    }
  });

  watch(capacitiesPlotLines, (newLines, oldLines) => {
    const yAxis = toValue(chart)?.yAxis[0];

    oldLines?.filter(({ id }) => {
      return !!id && !newLines?.map(n => n.id).includes(id);
    }).forEach(({ id }) => {
      !!id && yAxis?.removePlotLine(id);
    });

    newLines?.forEach((newLine) => {
      if (!oldLines?.map(o => o.id).includes(newLine.id)) {
        yAxis?.addPlotLine(newLine);
      }
    });
  });

  return {
    initialCapacitiesPlotLines: capacitiesPlotLines.value,
    minRange,
  };
};
