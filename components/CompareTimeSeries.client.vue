<template>
  <!-- :data-summary="JSON.stringify({ firstDataPoint: data[0], lastDataPoint: data[data.length - 1], dataLength: data.length })" -->
  <div
    :id="chartContainerId"
    ref="chartContainer"
    class="chart-container time-series"
    :style="{ zIndex, height: 'fit-content' }"
    @mousemove="onMove"
    @touchmove="onMove"
    @touchstart="onMove"
  />
</template>

<script setup lang="ts">
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/accessibility";
import "highcharts/esm/modules/exporting";
import "highcharts/esm/modules/export-data";
import "highcharts/esm/modules/offline-exporting";
import { debounce } from "perfect-debounce";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeColors, contextButtonOptions, menuItemDefinitionOptions, nonBaselineOpacity, plotBandsColor, plotLinesColor } from "./utils/highCharts";
import throttle from "lodash.throttle";

const props = defineProps<{
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  synchPoint: Highcharts.Point | null
  timeSeriesMetadata: DisplayInfo
  yUnits: string
}>();

const emit = defineEmits<{
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const appStore = useAppStore();

// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.allTimeSeriesMetadata!).length - props.groupIndex) + 3;
const chartContainerId = computed(() => `${props.timeSeriesMetadata.id}-container`);

const chartContainer = ref<HTMLDivElement | null>(null);

let chart: Highcharts.Chart;

const getChartSeries = (): Highcharts.SeriesLineOptions[] => {
  const series: Highcharts.SeriesLineOptions[] = [];
  appStore.currentComparison.scenarios.forEach((scenario, index) => {
    // Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
    const data: TimeSeriesDataPoint[] = scenario.result.data?.time_series[props.timeSeriesMetadata.id].map((val, i) => [i + 1, val]) ?? [];
    const isBaseline = scenario === appStore.baselineScenario;

    series.push({
      type: "line",
      name: `${appStore.axisMetadata?.label}: ${appStore.getScenarioAxisLabel(scenario)}`,
      data,
      color: colorBlindSafeColors.map(c => c.rgb)[index % colorBlindSafeColors.length],
      marker: {
        enabled: false,
        symbol: "circle",
      },
      custom: {
        synchronized: true,
        id: appStore.getScenarioAxisValue(scenario),
      },
      lineWidth: isBaseline ? 3 : 1.5,
      opacity: isBaseline ? 1 : nonBaselineOpacity,
      states: {
        hover: {
          lineWidth: 3,
          opacity: 1,
        },
        inactive: {
          opacity: isBaseline ? nonBaselineOpacity : 0.2,
        },
      },
      zIndex: isBaseline ? 2 : 1,
    });
  });

  return series;
};

const usePlotLines = props.timeSeriesMetadata.id === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/

// The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
// plotLines remain visible even when the maximum data value is less than the maximum plotline value.
const minRange = computed(() => usePlotLines && false
  ? appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0)
  : undefined);

const capacitiesPlotLines = computed(() => {
  const lines = new Array<Highcharts.AxisPlotLinesOptions>();

  if (!usePlotLines || true) {
    return lines;
  }

  appStore.capacitiesData?.forEach(({ id, value }) => {
    const capacityLabel = appStore.metadata?.results.capacities.find(({ id: capacityId }) => capacityId === id)?.label;

    lines.push({
      color: plotLinesColor,
      label: {
        text: `${capacityLabel}: ${value}`,
        style: {
          color: plotLinesColor,
        },
      },
      width: 2,
      value,
      zIndex: 4, // Render plot line and label in front of the series line
    });
  });

  return lines;
});

const interventionsPlotBands = computed(() => {
  const bands = new Array<Highcharts.AxisPlotBandsOptions>();
  const usePlotBands = ["hospitalised", "new_hospitalised", "prevalence", "new_infected"].includes(props.seriesId); // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
  if (!usePlotBands || true) {
    return bands;
  }

  appStore.interventionsData?.forEach(({ start, end }) => {
    bands.push({ from: start, to: end, color: plotBandsColor });
  });

  return bands;
});

const chartInitialOptions = () => {
  return {
    credits: {
      enabled: false, // Omit credits to allow us to reduce margin and save vertical space on page. We must credit Highcharts elsewhere.
    },
    chart: {
      ...chartOptions,
      height: 250,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 35,
    },
    exporting: {
      // todo update this
      filename: `${props.timeSeriesMetadata.label} in ${appStore.currentScenario.parameters?.country}`,
      chartOptions: {
        title: {
          text: props.timeSeriesMetadata.label,
        },
        subtitle: {
          text: props.timeSeriesMetadata.description,
        },
        chart: {
          backgroundColor: chartBackgroundColorOnExporting,
          height: 500,
        },
      },
      buttons: {
        contextButton: contextButtonOptions,
      },
      menuItemDefinitions: menuItemDefinitionOptions,
    },
    title: {
      text: "",
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      headerFormat: `{series.name}<br/><span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>`,
      pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${props.yUnits}`,
      valueDecimals: 0,
    },
    xAxis: { // Omit title to save vertical space on page
      crosshair: true,
      plotBands: interventionsPlotBands.value,
      minTickInterval: 1,
      min: 1,
    },
    yAxis: {
      title: {
        text: "",
      },
      min: 0,
      minRange: minRange.value,
      plotLines: capacitiesPlotLines.value,
    },
    series: getChartSeries(),
  } as Highcharts.Options;
};

const onMove = throttle(() => {
  if (chart.hoverPoint) {
    emit("updateHoverPoint", chart.hoverPoint);
  }
}, 150, { leading: true });

watch(() => props.timeSeriesMetadata, () => {
  if (chart) {
    chart.update({ series: getChartSeries() });
  }
});

/**
 * Synchronize tooltips and crosshairs between charts.
 * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
 */
watch(() => props.synchPoint, (synchPoint) => {
  if (synchPoint && chart?.series) {
    // Get the series in this chart that matches the series being hovered in another chart
    const series = chart.series.find(series => series.options.custom?.id === synchPoint.series.options.custom?.id);
    // Get the point in the matching series that has the same 'x' value as the hovered point from another chart
    const point = series?.getValidPoints().find(({ x }) => x === synchPoint.x);

    if (point && point !== synchPoint) {
      point.onMouseOver();
    }
  }
});

watch(() => props.hideTooltips, (hideTooltips) => {
  if (hideTooltips) {
    chart.pointer.reset(false, 0); // Hide all tooltips and crosshairs
  }
});

watch(() => chartContainer.value, () => {
  if (!chart) {
    chart = Highcharts.chart(chartContainerId.value, chartInitialOptions());
  }
});

onUnmounted(() => {
  // Destroy this chart, since every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser if they aren't disposed of.
  chart.destroy();
});

const setChartHeight = debounce(async (height: number) => {
  chart.setSize(undefined, height, { duration: 250 });
}, 10);

watch(() => props.chartHeight, () => {
  setChartHeight(props.chartHeight);
});
</script>

<style lang="scss" scoped>
.chart-container.time-series {
  position: relative; /* Required for z-index to work */
  left: -10px;
}
</style>
