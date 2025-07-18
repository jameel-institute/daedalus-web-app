<template>
  <div
    id="costsChartContainer"
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
import { chartBackgroundColorOnExporting, chartOptions, colorBlindSafeColors, contextButtonOptions, costsChartLabelFormatter, costsChartStackLabelFormatter, costsChartTooltipText, getColorVariants, menuItemDefinitionOptions } from "./utils/highCharts";
import { costAsPercentOfGdp, gdpReferenceYear } from "./utils/formatters";
import { CostBasis } from "~/types/unitTypes";

const appStore = useAppStore();
let chart: Highcharts.Chart;
const seriesData = ref<Highcharts.SeriesColumnOptions[]>([]); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);

// A range of colors per column, to be used for the breakdowns within each column.
const columnColors = computed((): string[][] => {
  return appStore.totalCost?.children?.map((cost, i) => {
    const numberOfColorVariants = Math.max(cost.children?.length || 1);
    return getColorVariants(colorBlindSafeColors[i], numberOfColorVariants);
  }) || [[]];
});

// We need as many series as there are breakdowns in the most broken-down column.
const numberOfSeries = computed(() => appStore.totalCost?.children?.reduce((max, cost) => {
  return Math.max(max, cost.children?.length || 0);
}, 0) || 0);

// There are 3 levels of data breakdown for costs:
// 1) the top-level total,
// 2) the second level, GDP/life-years/education,
// 3) and a further breakdown, e.g. absences/closures in the cases of GDP and education.
// The levels are 'ragged' - i.e. not all items on a level will have the same number of children as each other.
// We don't display the top level in the chart.
// Each column corresponds to a second-level cost, and the third level is shown as a stacked break-down within the column.
// Since Highchart treats 'series' as the fundamental concept, and series are orthogonal to columns,
// we have to wrangle our data to match, as well as implement color logic ourselves.
// Each series' data is an array of each second-level cost's Nth child.
// For example, the first series should comprise the first child of GDP, first child of life-years, and the first child of education.
const getSeries = (): Highcharts.SeriesColumnOptions[] => {
  const series: Highcharts.SeriesColumnOptions[] = [];
  for (let rowIndex = 0; rowIndex < numberOfSeries.value; rowIndex++) {
    series.push({
      type: "column",
      data: appStore.totalCost?.children?.map((cost, columnIndex) => {
        const subCost = cost.children?.[rowIndex];
        // If there is no Nth child for some cost, we still need to create a breakdown for the stack with a y-value of 0,
        // to ensure that any subsequent data points will belong to the correct column.
        const dollarValue = subCost?.value || 0;
        const yValue = appStore.preferences.costBasis === CostBasis.PercentGDP
          ? costAsPercentOfGdp(dollarValue, appStore.currentScenario.result.data?.gdp)
          : dollarValue;

        return {
          y: yValue,
          name: appStore.getCostLabel(subCost?.id || ""),
          color: columnColors.value[columnIndex][rowIndex],
          custom: {
            includeInTooltips: !!subCost?.id,
          },
        };
      }) || [],
    });
  }

  seriesData.value = series;
  return series;
};

const costLabels = computed(() =>
  appStore.totalCost?.children?.map(cost => appStore.getCostLabel(cost.id)) || []);

const chartHeightPx = 400;
const yAxisTitle = computed(() => {
  return appStore.preferences.costBasis === CostBasis.PercentGDP
    ? `Losses as % of ${gdpReferenceYear} national GDP`
    : "Losses in billions USD";
});

const chartInitialOptions = () => {
  return {
    credits: {
      text: "Highcharts",
    },
    chart: {
      ...chartOptions,
      height: chartHeightPx,
      width: chartParentEl.value?.clientWidth,
    },
    exporting: {
      filename: `Losses in ${appStore.currentScenario.parameters?.country}`,
      chartOptions: {
        title: {
          text: `Losses in ${appStore.currentScenario.parameters?.country}`,
        },
        plotOptions: {
          column: {
            dataLabels: {
              allowOverlap: false,
              format: "{point.name}",
              enabled: true,
            },
          },
        },
        chart: {
          backgroundColor: chartBackgroundColorOnExporting,
          height: 500,
        },
      },
      buttons: {
        contextButton: {
          ...contextButtonOptions,
          theme: {
            fill: "transparent",
          },
        },
      },
      menuItemDefinitions: menuItemDefinitionOptions,
    },
    title: {
      text: "",
    },
    xAxis: {
      categories: costLabels.value,
    },
    yAxis: {
      gridLineColor: "lightgrey",
      min: 0,
      title: {
        text: yAxisTitle.value,
      },
      stackLabels: {
        enabled: true,
        formatter() {
          return costsChartStackLabelFormatter(this.total, appStore.preferences.costBasis);
        },
      },
      labels: {
        enabled: true,
        formatter() {
          return costsChartLabelFormatter(this.value, appStore.preferences.costBasis);
        },
      },
    },
    series: getSeries(),
    legend: {
      enabled: false,
    },
    tooltip: {
      shared: true,
      formatter() {
        return this.total ? costsChartTooltipText(this, appStore.preferences.costBasis, appStore.currentScenario.result.data!.gdp) : "";
      },
    },
    plotOptions: {
      column: {
        stacking: "normal",
        groupPadding: 0.05,
      },
    },
  } as Highcharts.Options;
};

watch(() => chartContainer.value, () => {
  if (appStore.costsData && !chart && chartContainer.value) {
    chart = Highcharts.chart("costsChartContainer", chartInitialOptions());
  }
});

watch(() => appStore.preferences.costBasis, () => {
  if (chart) {
    chart.update({
      yAxis: {
        title: {
          text: yAxisTitle.value,
        },
      },
      series: getSeries(),
    });
  }
});

const setChartDimensions = throttle(() => {
  if (chart && chartParentEl.value) {
    chart.setSize(chartParentEl.value.clientWidth, chartHeightPx, { duration: 250 });
  }
}, 25);

onMounted(() => {
  window.addEventListener("resize", setChartDimensions);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setChartDimensions);
});

onUnmounted(() => {
  // Destroy this chart, otherwise every time we navigate away and back to this page, another
  // chart is created, burdening the browser.
  chart?.destroy();
});
</script>

<style lang="scss">
#costsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries
}
</style>
