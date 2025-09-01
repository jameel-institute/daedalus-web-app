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
import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, menuItemDefinitionOptions } from "./utils/charts";
import { multiScenarioTimeSeriesChartTooltipFormatter, timeSeriesColors } from "./utils/timeSeriesCharts";
import { getTimeSeriesDataPoints, showCapacities, showInterventions, timeSeriesYUnits } from "./utils/timeSeriesData";
import useInterventionPlotBands from "~/composables/useInterventionPlotBands";
import type { ScenarioIntervention } from "~/types/resultTypes";
import { getScenarioLabel } from "./utils/comparisons";

const props = defineProps<{
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  showCapacities: boolean
  synchPoint: Highcharts.Point | undefined
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

const scenariosData = computed(() => {
  return appStore.currentComparison.scenarios.reduce((acc, scenario) => {
    if (!scenario.runId) {
      return acc;
    }
    acc[scenario.runId] = getTimeSeriesDataPoints(scenario, props.timeSeriesMetadata.id);

    return acc;
  }, {} as Record<string, TimeSeriesDataPoint[]>);
});

const chartTimeSeries = computed(() => {
  return appStore.currentComparison.scenarios.map((scenario, index) => {
    if (!scenario.runId) {
      return false;
    }
    const isBaseline = scenario === appStore.baselineScenario;
    const scenarioAxisVal = appStore.getScenarioAxisValue(scenario);

    return {
      type: "line",
      data: scenariosData.value[scenario.runId],
      name: `${appStore.axisMetadata?.label}: ${getScenarioLabel(scenarioAxisVal, appStore.axisMetadata)}`,
      color: timeSeriesColors[index % timeSeriesColors.length],
      fillOpacity: 0.4,
      marker: {
        symbol: "circle",
      },
      lineWidth: isBaseline ? 3 : 1.5,
      states: {
        hover: {
          lineWidth: 3,
          opacity: 1,
        },
        inactive: {
          opacity: 0.5,
        },
      },
      zIndex: isBaseline ? 2 : 1,
      custom: {
        synchronized: true,
        scenarioId: scenario.runId, // Identify the series to match it with corresponding series in other charts.
        showInterventions: showInterventions(props.timeSeriesMetadata.id),
        showCapacities: showCapacities(props.timeSeriesMetadata.id),
        isBaseline,
      },
    };
  }).filter(s => !!s);
});

const hoveredScenario = computed(() => appStore.currentComparison.scenarios.find(({ runId }) => {
  return runId === props.synchPoint?.series?.options?.custom?.scenarioId;
}));

// Plot the capacities as plot lines for whichever scenario's series is being hovered,
// or if none are hovered, the baseline scenario.
// The chart being hovered may be one that doesn't show capacities. If so,
// for charts that do show capacities, continue to show the baseline scenario's capacities.
const capacities = computed(() => {
  const hoveredChartShowsCapacities = props.synchPoint?.series?.options?.custom?.showCapacities === true;
  const foregroundedScenario = hoveredChartShowsCapacities ? hoveredScenario.value : appStore.baselineScenario;
  const caps = foregroundedScenario?.result.data?.capacities;

  return caps?.map((capacity) => {
    const label = appStore.metadata?.results.capacities
      .find(({ id: capacityId }) => capacityId === capacity.id)
      ?.label || "";
    const id = `${capacity.id}-${capacity.value}-${foregroundedScenario?.runId}`; // Ensure unique id for plot line
    return { ...capacity, id, label };
  });
});
const { initialCapacitiesPlotLines, initialMinRange } = useCapacitiesPlotLines(() => props.showCapacities, capacities, chart);

// Plot the response interventions as plot bands for whichever scenario's series is being hovered,
// or if none are hovered, the baseline scenario.
// The chart being hovered may be one that doesn't show interventions. If so,
// for charts that do show interventions, continue to show the baseline scenario's interventions (unlabelled).
const interventions = computed(() => {
  const hoveredChartShowsInterventions = props.synchPoint?.series?.options?.custom?.showInterventions === true;
  const foregroundedScenario = hoveredChartShowsInterventions ? hoveredScenario.value : appStore.baselineScenario;
  if (!foregroundedScenario) {
    return [];
  }
  const triggerPlotBandUpdate = !!props.synchPoint && hoveredChartShowsInterventions;
  const indexOfForegroundedSeries = appStore.currentComparison.scenarios.findIndex(s => s.runId === foregroundedScenario?.runId);
  const intvns = appStore.getScenarioResponseInterventions(foregroundedScenario);
  return intvns?.map((intvn: ScenarioIntervention) => {
    const label = triggerPlotBandUpdate ? `Intervention days ${intvn.start.toFixed(0)}–${intvn.end.toFixed(0)}` : ""; // No label if nothing is hovered
    // unique id lets Highcharts track individual plot bands for removePlotBand and addPlotBand
    const id = `${foregroundedScenario?.runId}-${intvn.start}-${intvn.end}-${triggerPlotBandUpdate}`;
    const color = timeSeriesColors[indexOfForegroundedSeries % timeSeriesColors.length];
    return { ...intvn, color, id, label };
  });
});

const { initialInterventionsPlotBands } = useInterventionPlotBands(() => props.timeSeriesMetadata, interventions, chart);

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
      marginTop: 15, // Enough space for a label to fit above the plot band
    },
    exporting: exportingOptions.value,
    title: {
      text: "",
    },
    legend: {
      enabled: false,
    },
    series: chartTimeSeries.value,
    tooltip: {
      formatter() {
        return multiScenarioTimeSeriesChartTooltipFormatter(this, yUnits.value);
      },
    },
    xAxis: {
      title: {
        text: "Days since outbreak",
      },
      crosshair: true,
      minTickInterval: 1,
      min: 1,
      max: chartTimeSeries.value[0].data.length,
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
  };
};

watch([() => props.timeSeriesMetadata, chartTimeSeries], () => {
  chart.value?.update({
    exporting: exportingOptions.value,
  }, false);

  chartTimeSeries.value.forEach((series) => {
    const existingSeries = chart.value?.series.find(s => s.options.custom?.scenarioId === series.custom?.scenarioId);
    if (existingSeries) {
      existingSeries.update(series, false);
    } else {
      chart.value?.addSeries(series, false);
    }
  });

  chart.value?.series.forEach((series) => {
    if (!chartTimeSeries.value.map(s => s.custom?.scenarioId).includes(series.options.custom?.scenarioId)) {
      series.remove(false);
    }
  });
  // Adding a minimal 'defer' value appears to cause the animations to have enough time to run.
  chart.value?.redraw({ defer: 1 });
});

watch([chartContainer], () => {
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
