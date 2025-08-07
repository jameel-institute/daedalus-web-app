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
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeColors, contextButtonOptions, menuItemDefinitionOptions } from "./utils/highCharts";
import { getTimeSeriesDataPoints } from "./utils/timeSeriesData";

const props = defineProps<{
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  synchPoint: Highcharts.Point | undefined
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

const chartContainerId = computed(() => `${props.timeSeriesMetadata.id}-container`);

const scenariosData = computed(() => {
  return appStore.currentComparison.scenarios.reduce((acc, scenario) => {
    if (!scenario.runId) {
      return acc;
    }
    const dataPoints = getTimeSeriesDataPoints(scenario, props.timeSeriesMetadata.id);
    acc[scenario.runId] = {
      dataPoints,
      label: appStore.getScenarioAxisLabel(scenario),
      axisVal: appStore.getScenarioAxisValue(scenario),
    };

    return acc;
  }, {} as Record<string, Record<string, string | TimeSeriesDataPoint[]>>);
});

const getChartSeries = (): Highcharts.SeriesLineOptions[] => {
  const series: Highcharts.SeriesLineOptions[] = [];
  appStore.currentComparison.scenarios.forEach((scenario, index) => {
    if (!scenario.runId) {
      return;
    }
    const isBaseline = scenario === appStore.baselineScenario;
    const scenarioData = scenariosData.value[scenario.runId];

    series.push({
      type: "line",
      data: scenarioData.dataPoints as TimeSeriesDataPoint[],
      name: `${appStore.axisMetadata?.label}: ${scenarioData.label}`,
      color: colorBlindSafeColors.map(c => c.rgb)[index % colorBlindSafeColors.length],
      marker: {
        enabled: false,
        symbol: "circle",
      },
      lineWidth: isBaseline ? 3 : 1.5,
      states: {
        hover: {
          lineWidth: 3,
          opacity: 1,
        },
        inactive: {
          enabled: false, // TODO: decide once and for all whether we opacify inactive series. Requires change to legend component.
        },
      },
      zIndex: isBaseline ? 2 : 1,
      custom: {
        synchronized: true,
        id: scenarioData.axisVal,
      },
    });
  });

  return series;
};

// The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
// plotLines remain visible even when the maximum data value is less than the maximum plotline value.
// const minRange = computed(() => showCapacities.value && false
//   ? appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0)
//   : undefined);

const chartInitialOptions = () => {
  return {
    credits: {
      enabled: false, // Omit credits to allow us to reduce margin and save vertical space on page. We must credit Highcharts elsewhere.
    },
    chart: {
      ...chartOptions,
      height: 250,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 55,
    },
    exporting: {
      filename: props.timeSeriesMetadata.label,
      chartOptions: {
        title: {
          text: `${props.timeSeriesMetadata.label} by ${appStore.axisMetadata?.label.toLocaleLowerCase()}`,
        },
        subtitle: {
          text: props.timeSeriesMetadata.description,
        },
        chart: {
          backgroundColor: chartBackgroundColorOnExporting,
          height: 500,
          marginBottom: undefined,
        },
        legend: {
          enabled: true,
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
    xAxis: {
      title: {
        text: "Days since outbreak",
      },
      crosshair: true,
      minTickInterval: 1,
      min: 1,
    },
    yAxis: {
      title: {
        text: "",
      },
      min: 0,
      // minRange: minRange.value, // TODO
    },
    series: getChartSeries(),
  } as Highcharts.Options;
};

watch(() => props.timeSeriesMetadata, () => {
  chart.value?.update({ series: getChartSeries() });
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
</script>

<style lang="scss" scoped>
.chart-container.time-series {
  position: relative; /* Required for z-index to work */
  left: -10px;
}
</style>
