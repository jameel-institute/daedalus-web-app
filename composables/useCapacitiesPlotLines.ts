import { humanReadableInteger } from "~/components/utils/formatters";
import { plotLinesColor } from "~/components/utils/timeSeriesCharts";
import type { TimeSeriesCapacity } from "~/types/dataTypes";

export default (
  showCapacities: MaybeRefOrGetter<boolean>,
  capacities: MaybeRefOrGetter<Array<TimeSeriesCapacity> | undefined>,
  chart: MaybeRefOrGetter<Highcharts.Chart | undefined>,
) => {
  const capacitiesPlotLines = computed(() => {
    if (!toValue(showCapacities) || !toValue(capacities)?.length) {
      return [];
    }

    return toValue(capacities)?.map(({ id, value, label }) => {
      return {
        color: plotLinesColor,
        label: {
          text: `${label}: ${humanReadableInteger(value.toString())}`,
          style: {
            color: plotLinesColor,
          },
          align: "middle",
        },
        width: 2,
        value,
        zIndex: 4, // Render label in front of the series line
        id,
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

  const yAxis = computed(() => toValue(chart)?.yAxis[0]);

  watch(capacitiesPlotLines, (newLines, oldLines) => {
    oldLines?.filter(({ id }) => {
      return !!id && !newLines?.map(n => n.id).includes(id);
    }).forEach(({ id }) => {
      !!id && yAxis.value?.removePlotLine(id);
    });

    newLines?.forEach((newLine) => {
      if (!oldLines?.map(o => o.id).includes(newLine.id)) {
        yAxis.value?.addPlotLine(newLine);
      }
    });
  });

  watch(minRange, (newMinRange) => {
    if (yAxis.value?.options?.minRange !== newMinRange) {
      yAxis.value?.update({ minRange: newMinRange });
    };
  });

  return {
    initialCapacitiesPlotLines: capacitiesPlotLines.value,
    initialMinRange: minRange.value,
  };
};
