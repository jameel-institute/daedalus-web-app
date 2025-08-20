import { humanReadableInteger } from "~/components/utils/formatters";
import { plotLinesColor } from "~/components/utils/highCharts";
import type { ScenarioCapacity } from "~/types/resultTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  capacities: MaybeRefOrGetter<Array<ScenarioCapacity> | undefined>,
  chart: Ref<Highcharts.Chart | undefined>,
) => {
  const appStore = useAppStore();

  const capacitiesPlotLines = computed(() => {
    if (!toValue(showCapacities)) {
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
  const minRange = computed(() => toValue(showCapacities)
    ? toValue(capacities)?.reduce((acc, { value }) => Math.max(acc, value), 0)
    : undefined);

  watch(capacitiesPlotLines, (newPlotLines, oldPlotLines) => {
    const yAxis = chart.value?.yAxis[0];
    oldPlotLines.forEach((oldPlotLine) => {
      if (oldPlotLine?.id && !newPlotLines.map(({ id }) => id).includes(oldPlotLine?.id)) {
        yAxis?.removePlotLine(oldPlotLine.id);
      }
    });

    newPlotLines.forEach((newPlotLine) => {
      if (newPlotLine && !oldPlotLines.map(({ id }) => id).includes(newPlotLine?.id)) {
        yAxis?.addPlotLine(newPlotLine);
      }
    });
  });

  return {
    capacitiesPlotLines,
    minRange,
  };
};
