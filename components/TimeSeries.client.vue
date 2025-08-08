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
import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeColors, contextButtonOptions, menuItemDefinitionOptions, plotBandsColorName, plotBandsDefaultColor, plotLinesColorName } from "./utils/highCharts";
import { getTimeSeriesDataPoints, seriesCanShowInterventions } from "./utils/timeSeriesData";
import useCapacitiesPlotLines from "~/composables/useCapacitiesPlotLines";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

const props = defineProps<{
  chartHeight: number
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  synchPoint: Highcharts.Point | undefined
  seriesRole: string
  timeSeriesMetadata: DisplayInfo
  yUnits: string
}>();

const emit = defineEmits<{
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const appStore = useAppStore();

const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<Highcharts.Chart | undefined>(undefined);

const { onMove } = useSynchronisableChart(
  chart,
  () => props.hideTooltips,
  () => props.synchPoint,
  (point: Highcharts.Point) => emit("updateHoverPoint", point),
);
const { zIndex } = useAdjacentCharts(() => props.groupIndex);

const seriesColors = colorBlindSafeColors
  .filter(c => ![plotBandsColorName, plotLinesColorName].includes(c.name))
  .map(c => c.rgb);

const chartContainerId = computed(() => `${props.timeSeriesMetadata.id}-container`);

const data = computed(() => getTimeSeriesDataPoints(appStore.currentScenario, props.timeSeriesMetadata.id));

const getChartSeries = (): Array<Highcharts.SeriesLineOptions | Highcharts.SeriesAreaOptions> => {
  return [{
    type: props.seriesRole === "total" ? "area" : "line",
    data: data.value,
    name: props.timeSeriesMetadata!.label,
    color: seriesColors[props.groupIndex % seriesColors.length],
    fillOpacity: 0.3,
    marker: {
      enabled: false,
    },
    states: {
      hover: {
        lineWidthPlus: 0,
      },
      inactive: {
        enabled: false,
      },
    },
    custom: {
      synchronized: true,
      id: appStore.currentScenario.runId,
    },
  }];
};

// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const showCapacities = computed(() => props.timeSeriesMetadata.id === "hospitalised");
const { capacitiesPlotLines, minRange } = useCapacitiesPlotLines(showCapacities, appStore.capacitiesData);
const showInterventions = computed(() => seriesCanShowInterventions(props.timeSeriesMetadata.id));
const interventions = computed(() => {
  const intervention = {
    ...appStore.getScenarioResponseIntervention(appStore.currentScenario),
    color: plotBandsDefaultColor,
  } as TimeSeriesIntervention;
  return intervention ? [intervention] : [];
});
const { interventionsPlotBands } = useInterventionsPlotBands(showInterventions, interventions);

const exportingOptions = computed(() => ({
  filename: props.timeSeriesMetadata.label,
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
}));

const yAxisUpdatableOptions = computed(() => ({
  minRange: minRange.value,
  plotLines: capacitiesPlotLines.value,
}));

const chartInitialOptions = () => {
  return {
    credits: {
      enabled: false, // Omit credits to allow us to reduce margin and save vertical space on page. We must credit Highcharts elsewhere.
    },
    chart: {
      ...chartOptions,
      height: props.chartHeight,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 35,
    },
    exporting: exportingOptions.value,
    title: {
      text: "",
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      headerFormat: "<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>",
      pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${props.yUnits}`,
      valueDecimals: 0,
    },
    xAxis: { // Omit title to save vertical space on page
      crosshair: true,
      minTickInterval: 1,
      min: 1,
      plotBands: interventionsPlotBands.value,
    },
    yAxis: {
      ...yAxisUpdatableOptions.value,
      title: {
        text: "",
      },
      min: 0,
    },
    series: getChartSeries(),
  } as Highcharts.Options;
};

watch(() => props.timeSeriesMetadata, () => {
  let updates = {
    exporting: exportingOptions.value,
    series: getChartSeries(),
    xAxis: {
      plotBands: interventionsPlotBands.value,
    },
  } as Highcharts.Options;

  // Only update the yAxis if necessary, since doing so prevents the redraw animation.
  if (chart.value && chart.value.yAxis[0].options.minRange !== minRange.value) {
    // If the minRange has changed, update the chart to reflect this.
    // This is necessary if the capacities have changed, for example.
    updates = { ...updates, yAxis: yAxisUpdatableOptions.value };
  };

  chart.value?.update(updates);
});

watch(() => chartContainer.value, () => {
  if (!chart.value) {
    chart.value = Highcharts.chart(chartContainerId.value, chartInitialOptions());
  }
});

onUnmounted(() => {
  // Destroy this chart, since every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser if they aren't disposed of.
  chart.value?.destroy();
});

const setChartHeight = debounce(async (height: number) => {
  chart.value?.setSize(undefined, height, { duration: 250 });
}, 10);

watch(() => props.chartHeight, () => {
  setChartHeight(props.chartHeight);
});
</script>

<style lang="scss" scoped>
.chart-container.time-series {
  width: 100%;
  position: relative; /* Required for z-index to work */
  left: -20px;
}
</style>
