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
import "highcharts/esm/highcharts-more";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesDataPoint, TimeSeriesIntervention } from "~/types/dataTypes";
import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, getScenarioCategoryLabel, menuItemDefinitionOptions, multiScenarioTimeSeriesColors } from "./utils/highCharts";
import { getTimeSeriesDataPoints, timeSeriesYUnits } from "./utils/timeSeriesData";
import { humanReadableInteger } from "./utils/formatters";
import useInterventionsAreaRanges from "~/composables/useInterventionsAreaRanges";

const props = defineProps<{
  groupIndex: number // Probably 0 to about 4
  hideTooltips: boolean
  showCapacities: boolean
  synchPoint: Highcharts.Point | undefined
  enable3d: boolean
  timeSeriesMetadata: DisplayInfo
  toggledShowBaselineIntervention: boolean
  toggledShowAllInterventions: boolean
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
      type: props.enable3d ? "area" : "line",
      data: scenariosData.value[scenario.runId],
      name: `${appStore.axisMetadata?.label}: ${getScenarioCategoryLabel(scenarioAxisVal, appStore.axisMetadata)}`,
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
        id: scenarioAxisVal,
        isBaseline,
      },
    };
  }).filter(s => !!s);
});

const baselineCapacities = computed(() => appStore.baselineScenario?.result.data?.capacities);
const { capacitiesPlotLines, minRange } = useCapacitiesPlotLines(() => props.showCapacities, baselineCapacities);

const interventions = computed((): TimeSeriesIntervention[] => {
  // Iterate over all scenarios in any case, so that the color indices are consistent between plot bands and series.
  const allInterventions = appStore.currentComparison.scenarios.reduce((acc, scenario, i) => {
    const intervention = appStore.getScenarioResponseIntervention(scenario);
    if (intervention && scenario.runId) {
      acc[scenario.runId] = { ...intervention, color: seriesColors[i % seriesColors.length] };
    };
    return acc;
  }, {} as Record<string, TimeSeriesIntervention>);

  if (props.toggledShowAllInterventions) {
    return Object.values(allInterventions);
  } else if (props.toggledShowBaselineIntervention && appStore.baselineScenario?.runId) {
    const intervention = allInterventions[appStore.baselineScenario.runId];
    return intervention ? [intervention] : [];
  }

  return [];
});

const { interventionsAreaRangeSeries, interventionsYAxisOptions } = useInterventionsAreaRanges(() => props.timeSeriesMetadata, interventions);

const allSeries = computed(() => {
  return [...chartTimeSeries.value, ...interventionsAreaRangeSeries.value] as Array<Highcharts.SeriesLineOptions | Highcharts.SeriesAreaOptions | Highcharts.SeriesArearangeOptions>;
});

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

const yAxisUpdatableOptions = computed(() => ([
  {
    minRange: minRange.value,
    plotLines: capacitiesPlotLines.value,
    title: {
      text: "",
    },
    min: 0,
  },
  interventionsYAxisOptions.value,
]));

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
        enabled: props.enable3d,
        alpha: 15,
        beta: 20,
        depth: appStore.currentComparison.scenarios.length * areaSeriesDepth,
      },
    },
    plotOptions: {
      area: {
        depth: areaSeriesDepth,
      },
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
      formatter() {
        const dayText = `<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day ${this.x}</span><br/>`;
        const yText = `<span style='font-weight: 500'>${humanReadableInteger(this.y?.toFixed(0) ?? "0")}</span> ${yUnits.value}`;
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
      max: chartTimeSeries.value[0].data.length,
    },
    yAxis: yAxisUpdatableOptions.value,
    series: allSeries.value,
  } as Highcharts.Options;
};

watch([() => props.enable3d, () => props.timeSeriesMetadata, interventions, yAxisUpdatableOptions, chartTimeSeries], ([isThreeD], [wasThreeD]) => {
  if (!isThreeD && wasThreeD) {
    // Hover markers do not work after returning to 2D mode from 3D, so we need to destroy and recreate the chart.
    chart.value = Highcharts.chart(chartContainerId.value, chartInitialOptions());
  } else {
    // Otherwise, we can update the chart in place, which ends up less performant but uses more animations.
    chart.value?.update({
      chart: {
        options3d: {
          enabled: props.enable3d,
        },
      },
      exporting: exportingOptions.value,
      yAxis: yAxisUpdatableOptions.value,
    }, false);

    // TODO: See if we can update just subproperties of a series sometimes (e.g. when toggling New per day) to make
    // chart updates faster. See e.g. https://stackoverflow.com/questions/16407901/highchart-series-update-in-javascript
    allSeries.value.forEach((series) => {
      const seriesIsAlreadyInChart = chart.value?.series.map(s => s.options.custom?.id).includes(series.custom?.id);
      if (seriesIsAlreadyInChart) {
        const existingSeries = chart.value?.series.find(s => s.options.custom?.id === series.custom?.id);
        if (existingSeries) {
          existingSeries.update(series, false);
        }
      } else {
        chart.value?.addSeries(series, false);
      }
    });

    const seriesToRemove = chart.value?.series.filter((series) => {
      return !allSeries.value.map(s => s.custom?.id).includes(series.options.custom?.id);
    });
    seriesToRemove?.forEach(s => s.remove(false));
    // Adding a minimal 'defer' value appears to cause the animations to have enough time to run.
    chart.value?.redraw({ defer: 1 });
  }
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
