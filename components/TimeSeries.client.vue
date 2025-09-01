<template>
  <div
    :id="chartContainerId"
    ref="chartContainer"
    class="chart-container time-series"
    :style="{ zIndex, height: 'fit-content' }"
    :data-summary="JSON.stringify({
      dataLength: data.length,
      maxValue: Math.max(...data.map(d => d[1])),
    })"
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
import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, menuItemDefinitionOptions } from "./utils/charts";
import { plotBandsDefaultColor, plotLinesColor, timeSeriesColors } from "./utils/timeSeriesCharts";
import { getTimeSeriesDataPoints, showInterventions, timeSeriesYUnits } from "./utils/timeSeriesData";
import useCapacitiesPlotLines from "~/composables/useCapacitiesPlotLines";
import type { ScenarioIntervention } from "~/types/resultTypes";

const props = defineProps<{
  chartHeight: number
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  synchPoint: Highcharts.Point | undefined
  seriesRole: string
  timeSeriesMetadata: DisplayInfo
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
const { zIndex } = useAdjacentCharts(() => props.groupIndex, () => Number(appStore.timeSeriesGroups?.length));

const chartContainerId = computed(() => `${props.timeSeriesMetadata.id}-container`);
const yUnits = computed(() => timeSeriesYUnits(props.timeSeriesMetadata.id));
const data = computed(() => getTimeSeriesDataPoints(appStore.currentScenario, props.timeSeriesMetadata.id));

// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const showCapacities = computed(() => props.timeSeriesMetadata.id === "hospitalised");
const capacities = computed(() => appStore.currentScenario.result.data?.capacities.map((capacity) => {
  const label = appStore.metadata?.results.capacities
    .find(({ id: capacityId }) => capacityId === capacity.id)
    ?.label || "";
  return { ...capacity, id: `${capacity.id}-${capacity.value}`, label, color: plotLinesColor };
}));
const { initialCapacitiesPlotLines, initialMinRange } = useCapacitiesPlotLines(showCapacities, capacities, chart);

const interventions = computed(() => {
  // The chart being hovered may be one that doesn't show interventions. If so, we don't need to update any chart's plot bands.
  const hoveredChartShowsInterventions = props.synchPoint?.series?.options?.custom?.showInterventions === true;
  const triggerPlotBandUpdate = !!props.synchPoint && hoveredChartShowsInterventions;
  const intvns = appStore.getScenarioResponseInterventions(appStore.currentScenario);
  return intvns?.map((intvn: ScenarioIntervention) => {
    const label = triggerPlotBandUpdate // No label if nothing is hovered
      ? `Intervention days ${intvn.start.toFixed(0)}–${intvn.end.toFixed(0)}`
      : "";
    // unique id lets Highcharts track unique plot bands for removePlotBand and addPlotBand
    const id = `${intvn.id}-${intvn.start}-${intvn.end}-${triggerPlotBandUpdate}`;
    return { ...intvn, color: plotBandsDefaultColor, id, label };
  });
});

const { initialInterventionsPlotBands } = useInterventionPlotBands(() => props.timeSeriesMetadata, interventions, chart);

const chartTimeSeries = computed((): Array<Highcharts.SeriesLineOptions | Highcharts.SeriesAreaOptions> => ([{
  type: props.seriesRole === "total" ? "area" : "line",
  data: data.value,
  name: props.timeSeriesMetadata!.label,
  color: timeSeriesColors[props.groupIndex % timeSeriesColors.length],
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
    showInterventions: showInterventions(props.timeSeriesMetadata.id),
  },
}]));

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
      marginTop: 15, // Enough space for a label to fit above the plot band
    },
    plotOptions: {
      arearange: {
        yAxis: 1,
      },
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
      pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${yUnits.value}`,
      valueDecimals: 0,
    },
    xAxis: { // Omit title to save vertical space on page
      crosshair: true,
      minTickInterval: 1,
      min: 1,
      plotBands: initialInterventionsPlotBands,
    },
    yAxis: {
      title: {
        text: "",
      },
      min: 0,
      minRange: initialMinRange,
      plotLines: initialCapacitiesPlotLines,
    },
    series: chartTimeSeries.value,
  } as Highcharts.Options;
};

watch(() => props.timeSeriesMetadata, () => {
  chart.value?.update({
    exporting: exportingOptions.value,
    series: chartTimeSeries.value,
  });
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
