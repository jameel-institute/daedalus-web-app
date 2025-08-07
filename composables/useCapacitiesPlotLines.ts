import { plotLinesColor } from "~/components/utils/highCharts";
import type { ScenarioCapacity } from "~/types/resultTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  capacities: MaybeRefOrGetter<Array<ScenarioCapacity> | undefined>,
) => {
  const appStore = useAppStore();

  const capacitiesPlotLines = computed(() => {
    if (!toValue(showCapacities) || !toValue(capacities)) {
      return [];
    }

    return toValue(capacities)?.map(({ id, value }) => {
      const capacityLabel = appStore.metadata?.results.capacities
        .find(({ id: capacityId }) => capacityId === id)
        ?.label;

      return {
        color: plotLinesColor,
        label: {
          text: `${capacityLabel}: ${value}`,
          style: {
            color: plotLinesColor,
          },
        },
        width: 2,
        value,
        zIndex: 4, // Render label in front of the series line
      };
    }) as Array<Highcharts.AxisPlotLinesOptions>;
  });

  // The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
  // to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
  // plotLines remain visible even when the maximum data value is less than the maximum plotLine value.
  const minRange = computed(() => toValue(showCapacities)
    ? toValue(capacities)?.reduce((acc, { value }) => Math.max(acc, value), 0)
    : undefined);

  return {
    capacitiesPlotLines,
    minRange,
  };
};
