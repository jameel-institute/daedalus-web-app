<template>
  <div>
    <div
      id="compareLifeYearsCostsChartContainer"
      ref="chartContainer"
      :data-summary="JSON.stringify(seriesSummary)"
    />
  </div>
</template>

<script lang="ts" setup>
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/accessibility";
import "highcharts/esm/modules/exporting";
import "highcharts/esm/modules/export-data";
import "highcharts/esm/modules/offline-exporting";

import { brightColors, chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, type CustomPointOptionsObject, menuItemDefinitionOptions } from "@/components/utils/charts";
import { costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioStackLabelFormatter, costsChartMultiScenarioXAxisLabelFormatter } from "~/components/Charts/Compare/utils/multiScenarioCostCharts";
import { costsChartYAxisTickFormatter, costsChartYAxisTitle, thickPlotLineForDiffedChart } from "~/components/Charts/utils/costCharts";
import { debounce } from "perfect-debounce";
import { diffAgainstBaseline } from "~/components/utils/comparisons";
import useSortedScenarios from "~/composables/useSortedScenarios";

const props = defineProps<{
  diffing: boolean
  chartHeightPx?: number
}>();

const appStore = useAppStore();
let chart: Highcharts.Chart;
const seriesSummary = ref<Highcharts.SeriesColumnOptions[]>([]); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);

const scenarios = computed(() => props.diffing
  ? appStore.currentComparison.scenarios.filter(s => s.runId !== appStore.baselineScenario?.runId)
  : appStore.currentComparison.scenarios);
const { sortedScenarios } = useSortedScenarios(scenarios);

const costBasis = computed(() => appStore.preferences.costBasis);
const chartTitle = computed(() => {
  const firstScenarioTimeSeries = appStore.currentComparison.scenarios[0].result?.data?.time_series;
  const scenarioDuration = Object.values(firstScenarioTimeSeries || {})[0].length - 1;
  return `Life years losses ${props.diffing ? "relative to comparison baseline " : ""}after ${scenarioDuration} days`;
});

const palette = brightColors;

const getSeries = (): Highcharts.SeriesColumnOptions[] => {
  // Take the first scenario's costs as an example to find out what the second-level breakdowns are.
  const lifeYearsCost = sortedScenarios.value[0].result.data?.costs[0].children
    ?.find(({ id }) => id === "life_years");
  const bottomLevelCostIds = lifeYearsCost?.children?.map(c => c.id) || [];

  const allSeries = bottomLevelCostIds?.map((costId, rowIndex) => {
    return {
      type: "column" as Highcharts.SeriesColumnOptions["type"],
      name: appStore.getCostLabel(costId),
      borderWidth: 1,
      zIndex: bottomLevelCostIds.length - rowIndex, // Ensure that stack segments are in front of each other from top to bottom.
      data: sortedScenarios.value.map((scenario) => {
        const subCost = appStore.getScenarioCostById(scenario, costId)!;
        const y = props.diffing ? diffAgainstBaseline(subCost, LIFE_YEARS_METRIC) : getValueFromCost(subCost, LIFE_YEARS_METRIC);
        const name = appStore.getCostLabel(subCost.id);
        return {
          y,
          name,
          color: palette[rowIndex].rgb,
          custom: {
            includeInTooltips: true,
            scenarioId: scenario.runId,
          },
        } as CustomPointOptionsObject;
      }),
    };
  }) || [];

  // NB: when some sub-stacks are negative, the stack total produced by Highcharts is the sum of only the positive
  // sub-stacks, not the actual net total. So we have to calculate that total ourselves.
  const flatData = allSeries.flatMap(s => s.data as CustomPointOptionsObject[]);
  allSeries.forEach((ser) => {
    const newData = ser.data?.map((dataPoint) => {
      const stackNetTotal = flatData
        .filter(({ custom }) => custom.scenarioId === dataPoint.custom.scenarioId)
        .reduce((acc, { y }) => acc + y!, 0);
      return {
        ...dataPoint,
        custom: {
          ...dataPoint.custom,
          stackNetTotal,
        },
      };
    });
    ser.data = newData;
  });

  seriesSummary.value = allSeries;
  return seriesSummary.value;
};

const defaultChartHeightPx = 300;
const rowPadding = 12;
const targetWidth = () => {
  return chartParentEl.value ? chartParentEl.value.clientWidth - (2 * rowPadding) : 0;
};

const chartInitialOptions = () => {
  return {
    credits: { text: "Highcharts" },
    colors: palette.map(color => color.rgb),
    chart: { ...chartOptions, height: props.chartHeightPx ?? defaultChartHeightPx, width: targetWidth() },
    exporting: {
      filename: chartTitle.value,
      chartOptions: {
        plotOptions: {
          column: {
            dataLabels: { allowOverlap: false, format: "{point.name}", enabled: true },
          },
        },
        chart: { backgroundColor: chartBackgroundColorOnExporting, height: 500 },
      },
      buttons: { contextButton: { ...contextButtonOptions } },
      menuItemDefinitions: menuItemDefinitionOptions,
    },
    title: {
      text: chartTitle.value,
      style: {
        fontWeight: "medium",
        fontSize: "1.1rem",
      },
    },
    xAxis: {
      categories: sortedScenarios.value.map(s => appStore.getScenarioAxisValue(s)),
      title: { text: appStore.axisMetadata?.label },
      labels: {
        style: {
          fontSize: appStore.currentComparison.axis === appStore.globeParameter?.id ? "0.8rem" : "1rem",
        },
        formatter() {
          return costsChartMultiScenarioXAxisLabelFormatter(this.value as string, appStore.axisMetadata, appStore.currentComparison.baseline);
        },
        useHTML: true,
      },
    },
    yAxis: {
      gridLineColor: "lightgrey",
      min: props.diffing ? undefined : 0,
      plotLines: props.diffing ? [thickPlotLineForDiffedChart] : [],
      title: { text: costsChartYAxisTitle(LIFE_YEARS_METRIC, costBasis.value, props.diffing) },
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 500,
        },
        formatter() {
          return costsChartMultiScenarioStackLabelFormatter(this, costBasis.value, props.diffing, LIFE_YEARS_METRIC);
        },
      },
      labels: {
        enabled: true,
        formatter() {
          return costsChartYAxisTickFormatter(this.value, LIFE_YEARS_METRIC, costBasis.value);
        },
      },
    },
    series: getSeries(),
    legend: { enabled: false },
    tooltip: {
      shared: true,
      formatter() {
        return costsChartMultiScenarioStackedTooltip(this, costBasis.value, appStore.axisMetadata, props.diffing, LIFE_YEARS_METRIC);
      },
    },
    plotOptions: {
      column: {
        stacking: "normal",
        groupPadding: 0.3,
        borderRadius: 0, // Border radius mucks up very small stack elements.
      },
    },
  } as Highcharts.Options;
};

watch(() => [chartContainer.value, appStore.everyScenarioHasCosts], () => {
  if (!chart && chartContainer.value && appStore.everyScenarioHasCosts) {
    chart = Highcharts.chart("compareLifeYearsCostsChartContainer", chartInitialOptions());
  }
});

watch(() => costBasis.value, () => {
  chart?.update({
    yAxis: {
      title: {
        text: costsChartYAxisTitle(USD_METRIC, costBasis.value, props.diffing),
      },
    },
    series: getSeries(),
  });
});

watch(() => props.diffing, () => {
  chart?.update({
    exporting: {
      filename: chartTitle.value,
    },
    title: { text: chartTitle.value },
    xAxis: {
      categories: sortedScenarios.value.map(s => appStore.getScenarioAxisValue(s) || ""),
    },
    yAxis: {
      min: props.diffing ? undefined : 0,
      title: {
        text: costsChartYAxisTitle(USD_METRIC, costBasis.value, props.diffing),
      },
      plotLines: props.diffing ? [thickPlotLineForDiffedChart] : [],
    },
    series: getSeries(),
  });
});

const setChartDimensions = debounce(() => {
  if (chartParentEl.value) {
    chart?.setSize(targetWidth(), props.chartHeightPx ?? defaultChartHeightPx, { duration: 250 });
  }
});

onMounted(() => window.addEventListener("resize", setChartDimensions));
onBeforeUnmount(() => window.removeEventListener("resize", setChartDimensions));

watch(() => props.chartHeightPx, () => {
  setChartDimensions();
});
// Destroy this chart on unmounted, otherwise every time we navigate away and back to this page, another
// chart is created, burdening the browser.
onUnmounted(() => chart?.destroy());
</script>

<style lang="scss">
#compareLifeYearsCostsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries
}
</style>
