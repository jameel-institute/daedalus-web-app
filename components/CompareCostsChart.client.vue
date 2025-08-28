<template>
  <div>
    <div
      id="compareCostsChartContainer"
      ref="chartContainer"
      :data-summary="JSON.stringify(seriesData)"
    />
  </div>
</template>

<script lang="ts" setup>
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/accessibility";
import "highcharts/esm/modules/exporting";
import "highcharts/esm/modules/export-data";
import "highcharts/esm/modules/offline-exporting";

import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeSmallPalette, contextButtonOptions, costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioXAxisLabelFormatter, costsChartStackLabelFormatter, costsChartYAxisTickFormatter, menuItemDefinitionOptions, yAxisTitle } from "./utils/highCharts";
import { costAsPercentOfGdp } from "@/components/utils/formatters";
import { CostBasis } from "@/types/unitTypes";
import { debounce } from "perfect-debounce";

const appStore = useAppStore();
let chart: Highcharts.Chart;
const seriesData = ref<Highcharts.SeriesColumnOptions[]>([]); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);
const scenarios = computed(() => appStore.currentComparison.scenarios);
const costBasis = computed(() => appStore.preferences.costBasis);
const chartTitle = computed(() => {
  const firstScenarioTimeSeries = appStore.currentComparison.scenarios[0].result?.data?.time_series;
  const scenarioDuration = Object.values(firstScenarioTimeSeries || {})[0].length - 1;
  return `Losses after ${scenarioDuration} days`;
});

// There are 3 levels of data breakdown for costs:
// 1) the top-level total for the scenario,
// 2) the second level, GDP/life-years/education,
// 3) and a further breakdown, e.g. absences/closures in the cases of GDP and education.
// At the moment, only the second level is displayed in the chart.
// Series are orthogonal to columns, and here correspond to the second-level breakdowns.
// Each series' data is an array of each scenario's cost for that breakdown.
// For example, one series should comprise each scenario's GDP.
const getSeries = (): Highcharts.SeriesColumnOptions[] => {
  // Take the first scenario's costs as an example to find out what the second-level breakdowns are.
  const secondLevelCostIds = scenarios.value[0].result.data?.costs[0].children?.map(c => c.id) || [];
  seriesData.value = secondLevelCostIds?.map((costId, index) => ({
    type: "column",
    name: appStore.getCostLabel(costId),
    borderWidth: 1,
    borderColor: colorBlindSafeSmallPalette[index].rgb,
    zIndex: secondLevelCostIds.length - index, // Ensure that stack segments are in front of each other from top to bottom.
    data: scenarios.value.map((scenario) => {
      const subCost = scenario.result.data?.costs[0].children?.find(c => c.id === costId);
      const dollarValue = subCost?.value;
      // costAsGdpPercent is calculated here since the national GDP may vary by scenario if the axis is 'country'.
      const costAsGdpPercent = costAsPercentOfGdp(dollarValue, scenario.result.data?.gdp);
      const y = costBasis.value === CostBasis.PercentGDP ? costAsGdpPercent : dollarValue;
      const name = appStore.getCostLabel(subCost?.id || "");
      return { y, name, custom: { costAsGdpPercent } };
    }),
  } as Highcharts.SeriesColumnOptions)) || [];

  return seriesData.value;
};

const chartHeightPx = 500;
const rowPadding = 12;
const targetWidth = () => {
  return chartParentEl.value ? chartParentEl.value.clientWidth - (2 * rowPadding) : 0;
};

const chartInitialOptions = () => {
  return {
    credits: { text: "Highcharts" },
    colors: colorBlindSafeSmallPalette.map(color => color.rgb),
    chart: { ...chartOptions, height: chartHeightPx, width: targetWidth() },
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
      categories: scenarios.value?.map(s => appStore.getScenarioAxisValue(s)) || [],
      title: { text: appStore.axisLabel },
      labels: {
        style: { fontSize: appStore.currentComparison.axis === appStore.globeParameter?.id ? "0.8rem" : "1rem" },
        formatter() { return costsChartMultiScenarioXAxisLabelFormatter(this.value as string, appStore.axisMetadata); },
        useHTML: true,
      },
    },
    yAxis: {
      gridLineColor: "lightgrey",
      min: 0,
      title: { text: yAxisTitle(costBasis.value) },
      stackLabels: {
        enabled: true,
        formatter() { return costsChartStackLabelFormatter(this.total, costBasis.value); },
      },
      labels: {
        enabled: true,
        formatter() { return costsChartYAxisTickFormatter(this.value, costBasis.value); },
      },
    },
    series: getSeries(),
    legend: { enabled: false },
    tooltip: {
      shared: true,
      formatter() { return costsChartMultiScenarioStackedTooltip(this, costBasis.value, appStore.axisMetadata); },
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
    chart = Highcharts.chart("compareCostsChartContainer", chartInitialOptions());
  }
});

watch(() => costBasis.value, () => {
  if (chart) {
    chart.update({ yAxis: { title: { text: yAxisTitle(costBasis.value) } }, series: getSeries() });
  }
});

const setChartDimensions = debounce(() => {
  if (chart && chartParentEl.value) {
    chart.setSize(targetWidth(), chartHeightPx, { duration: 250 });
  }
});

onMounted(() => window.addEventListener("resize", setChartDimensions));
onBeforeUnmount(() => window.removeEventListener("resize", setChartDimensions));
// Destroy this chart on unmounted, otherwise every time we navigate away and back to this page, another
// chart is created, burdening the browser.
onUnmounted(() => chart?.destroy());
</script>

<style lang="scss">
#compareCostsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries
}
</style>
