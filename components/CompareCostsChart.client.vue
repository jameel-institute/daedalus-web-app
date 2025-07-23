<template>
  <div
    id="compareCostsChartContainer"
    ref="chartContainer"
    :data-summary="JSON.stringify(seriesData)"
  />
</template>

<script lang="ts" setup>
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/accessibility";
import "highcharts/esm/modules/exporting";
import "highcharts/esm/modules/export-data";
import "highcharts/esm/modules/offline-exporting";

import throttle from "lodash.throttle";
import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeColors, contextButtonOptions, costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioXAxisLabelFormatter, costsChartStackLabelFormatter, costsChartYAxisTickFormatter, menuItemDefinitionOptions } from "./utils/highCharts";
import { costAsPercentOfGdp, gdpReferenceYear } from "@/components/utils/formatters";
import { CostBasis } from "@/types/unitTypes";

const appStore = useAppStore();
let chart: Highcharts.Chart;
const seriesData = ref<Highcharts.SeriesColumnOptions[]>([]); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);
const scenarios = computed(() => appStore.currentComparison.scenarios);
const costBasis = computed(() => appStore.preferences.costBasis);
const chartTitleOnExport = computed(() => `Losses by ${appStore.axisLabel?.toLocaleLowerCase()}`);
const axisMetadata = computed(() => appStore.currentComparison.axis ? appStore.parametersMetadataById[appStore.currentComparison.axis] : undefined);

// There are 3 levels of data breakdown for costs:
// 1) the top-level total for the scenario,
// 2) the second level, GDP/life-years/education,
// 3) and a further breakdown, e.g. absences/closures in the cases of GDP and education.
// We don't display the top level in the chart.
// Series are orthogonal to columns, and here correspond to the second-level breakdowns.
// Each series' data is an array of each scenario's cost for that breakdown.
// For example, one series should comprise each scenario's GDP.
const getSeries = (): Highcharts.SeriesColumnOptions[] => {
  const exampleSecondLevelCosts = scenarios.value[0].result.data?.costs[0].children;
  seriesData.value = exampleSecondLevelCosts?.map((secondLevelCost, index) => ({
    type: "column",
    name: appStore.getCostLabel(exampleSecondLevelCosts?.[index].id || ""),
    data: scenarios.value.map((scenario) => {
      const subCost = scenario.result.data?.costs[0].children?.find(c => c.id === secondLevelCost.id);
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

const chartHeightPx = 400;
const yAxisTitle = computed(() => costBasis.value === CostBasis.PercentGDP
  ? `Losses as % of ${gdpReferenceYear} national GDP`
  : "Losses in billions USD",
);

// Fixes z-index issue:
// https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#html
Highcharts.HTMLElement.useForeignObject = true;

const chartInitialOptions = () => {
  return {
    credits: { text: "Highcharts" },
    colors: colorBlindSafeColors.map(color => color.rgb),
    chart: { ...chartOptions, height: chartHeightPx, width: chartParentEl.value?.clientWidth - 10 },
    exporting: {
      filename: chartTitleOnExport.value,
      chartOptions: {
        title: { text: chartTitleOnExport.value },
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
    title: { text: "" },
    xAxis: {
      categories: scenarios.value?.map(s => appStore.getScenarioAxisValue(s)) || [],
      title: { text: appStore.axisLabel },
      labels: {
        style: { fontSize: appStore.currentComparison.axis === appStore.globeParameter?.id ? "0.8rem" : "1rem" },
        formatter() { return costsChartMultiScenarioXAxisLabelFormatter(this.value as string, axisMetadata.value); },
        useHTML: true,
      },
    },
    yAxis: {
      gridLineColor: "lightgrey",
      min: 0,
      title: { text: yAxisTitle.value },
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
      formatter() { return costsChartMultiScenarioStackedTooltip(this, costBasis.value, axisMetadata.value); },
    },
    plotOptions: {
      column: { stacking: "normal", groupPadding: 0.3 },
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
    chart.update({ yAxis: { title: { text: yAxisTitle.value } }, series: getSeries() });
  }
});

const setChartDimensions = throttle(() => {
  if (chart && chartParentEl.value) {
    chart.setSize(chartParentEl.value.clientWidth, chartHeightPx, { duration: 250 });
  }
}, 25);

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
