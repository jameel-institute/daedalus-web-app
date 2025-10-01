import { humanReadableInteger } from "~/components/utils/formatters";
import { plotLinesColor, plotLinesWidthPx } from "~/components/Charts/utils/timeSeriesCharts";
import type { Scenario } from "~/types/storeTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  yAxis: MaybeRefOrGetter<Highcharts.Axis | undefined>,
  scenario: MaybeRefOrGetter<Scenario | undefined>,
) => {
  const appStore = useAppStore();

  const capacities = computed(() => toValue(scenario)?.result.data?.capacities);

  const capacitiesPlotLines = computed(() => {
    if (!toValue(showCapacities) || !capacities.value?.length) {
      return [];
    }

    return capacities.value?.map(({ id, value }) => {
      const label = appStore.metadata?.results.capacities
        .find(({ id: capacityId }) => id === capacityId)
        ?.label || "";

      return {
        color: plotLinesColor,
        label: {
          text: `${label}: ${humanReadableInteger(value.toString())}`,
          style: {
            color: plotLinesColor,
          },
          align: "middle",
        },
        dashStyle: "ShortDot",
        width: plotLinesWidthPx,
        value,
        zIndex: 4, // Render label in front of the series line
        id: `${id}-${value}-${toValue(scenario)?.runId}`, // Ensure unique id for plot line
      };
    }) as Array<Highcharts.AxisPlotLinesOptions>;
  });

  // The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
  // to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
  // plotLines remain visible even when the maximum data value is less than the maximum plotLine value.
  const minRange = computed(() => {
    if (toValue(showCapacities) && capacities.value?.length) {
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
