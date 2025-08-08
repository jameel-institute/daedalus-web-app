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
import "highcharts/esm/highcharts-3d";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesDataPoint, TimeSeriesIntervention } from "~/types/dataTypes";
import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, menuItemDefinitionOptions, multiScenarioTimeSeriesColors } from "./utils/highCharts";
import { getTimeSeriesDataPoints, seriesCanShowInterventions } from "./utils/timeSeriesData";
import { humanReadableInteger } from "./utils/formatters";
import type { ScenarioIntervention } from "~/types/resultTypes";

const props = defineProps<{
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  showCapacities: boolean
  synchPoint: Highcharts.Point | undefined
  threeD: boolean
  timeSeriesMetadata: DisplayInfo
  toggledShowBaselineIntervention: boolean
  toggledShowAllInterventions: boolean
  yUnits: string
}>();

const emit = defineEmits<{
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const appStore = useAppStore();

const areaSeriesDepth = 30;
const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<Highcharts.Chart | undefined>(undefined);

const { onMove } = useSynchronisableChart(
  chart,
  () => props.hideTooltips,
  () => props.synchPoint,
  (point: Highcharts.Point) => emit("updateHoverPoint", point),
);
const { zIndex } = useAdjacentCharts(() => props.groupIndex);

const seriesColors = multiScenarioTimeSeriesColors.map(c => c.rgb);

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

const getChartSeries = () => {
  const series: Array<Highcharts.SeriesLineOptions | Highcharts.SeriesAreaOptions> = [];
  appStore.currentComparison.scenarios.forEach((scenario, index) => {
    if (!scenario.runId) {
      return;
    }
    const isBaseline = scenario === appStore.baselineScenario;
    const scenarioData = scenariosData.value[scenario.runId];

    series.push({
      type: props.threeD ? "area" : "line",
      data: scenarioData.dataPoints as TimeSeriesDataPoint[],
      name: `${appStore.axisMetadata?.label}: ${scenarioData.label}`,
      color: seriesColors[index % seriesColors.length],
      fillOpacity: 0.4,
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
        isBaseline,
      },
    });
  });

  return series;
};

const baselineCapacities = computed(() => appStore.baselineScenario?.result.data?.capacities);
const { capacitiesPlotLines, minRange } = useCapacitiesPlotLines(() => props.showCapacities, baselineCapacities);

const interventions = computed(() => {
  if (!appStore.baselineScenario) {
    return [];
  }

  let itns: Array<ScenarioIntervention | undefined> = [];
  if (props.toggledShowAllInterventions) {
    itns = appStore.currentComparison.scenarios.map(s => appStore.getScenarioResponseIntervention(s));
  } else if (props.toggledShowBaselineIntervention) {
    itns = [appStore.getScenarioResponseIntervention(appStore.baselineScenario)];
  };

  itns = itns.filter(itn => itn !== undefined);

  return itns.map((itn, idx) => {
    return {
      ...itn,
      color: seriesColors[idx % seriesColors.length],
    } as TimeSeriesIntervention;
  });
});
const showInterventions = computed(() => Number(interventions.value?.length) > 0 && seriesCanShowInterventions(props.timeSeriesMetadata.id));
const { interventionsPlotBands } = useInterventionsPlotBands(showInterventions, interventions);

const exportingChartTitle = computed(() => {
  return `${props.timeSeriesMetadata.label} by ${appStore.axisMetadata?.label.toLocaleLowerCase()}`;
});

const exportingOptions = computed(() => ({
  filename: props.timeSeriesMetadata.label,
  chartOptions: {
    title: {
      text: exportingChartTitle.value,
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
      height: 250,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 55,
      options3d: {
        enabled: props.threeD,
        alpha: 15,
        beta: 20,
        depth: appStore.currentComparison.scenarios.length * areaSeriesDepth,
      },
    },
    plotOptions: {
      area: {
        depth: areaSeriesDepth,
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
      formatter() {
        const dayText = `<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day ${this.x}</span><br/>`;
        const yText = `<span style='font-weight: 500'>${humanReadableInteger(this.y?.toFixed(0) ?? "0")}</span> ${props.yUnits}`;
        if (this.series.options.custom?.isBaseline) {
          return `${this.series.name} (baseline)<br/>${dayText}${yText}`;
        }
        const baselineSeries = this.series.chart.series.find(s => s.options.custom?.isBaseline);
        const matchingPointInBaseline = baselineSeries?.data.find(p => p.x === this.x);
        return `${this.series.name}<br/>${dayText}${yText}`
          + ` (baseline: ${humanReadableInteger(matchingPointInBaseline?.y?.toFixed(0) ?? "0")})`;
      },
    },
    xAxis: {
      title: {
        text: "Days since outbreak",
      },
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
  chart.value?.update({
    exporting: exportingOptions.value,
    series: getChartSeries(),
    yAxis: yAxisUpdatableOptions.value,
  });
});

watch(yAxisUpdatableOptions, newYAxisOptions => chart.value?.update({ yAxis: newYAxisOptions }));
watch(interventionsPlotBands, newPlotBands => chart.value?.update({ xAxis: { plotBands: newPlotBands } }));

watch(() => props.threeD, () => {
  chart.value?.update({
    chart: {
      options3d: {
        enabled: props.threeD,
      },
    },
    series: getChartSeries(),
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
</script>

<style lang="scss" scoped>
.chart-container.time-series {
  position: relative; /* Required for z-index to work */
  left: -10px;
}
</style>
