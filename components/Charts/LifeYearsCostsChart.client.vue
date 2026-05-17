<template>
  <div
    id="lifeYearsChartContainer"
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

import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, getColorVariants, menuItemDefinitionOptions } from "~/components/utils/charts";
import { costsChartPalette, costsChartYAxisTickFormatter, costsChartYAxisTitle } from "./utils/costCharts";
import { costsChartSingleScenarioLifeYearsTooltip, costsChartSingleScenarioStackLabelFormatter } from "./utils/singleScenarioCostCharts";
import { debounce } from "perfect-debounce";

const appStore = useAppStore();
let chart: Highcharts.Chart;
const seriesData = ref<Highcharts.SeriesColumnOptions>(); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);

const totalLifeYearsCost = computed(() => appStore.getScenarioTotalCost(appStore.currentScenario)?.children?.find(cost => cost.id === "life_years"));

// A range of colors per column, to be used for the breakdowns within each column.
const columnColors = computed((): string[] => {
  const numberOfColorVariants = Math.max(totalLifeYearsCost.value?.children?.length || 1);
  return getColorVariants(costsChartPalette.find(({ name }) => name === "Sky blue")!, numberOfColorVariants);
});

// There are 2 levels of data breakdown for life years costs:
// 1) the total life years level,
// 2) and a further breakdown by age group.
// Each column corresponds to a second-level cost. This means we only need one series.
const getSeries = (): Highcharts.SeriesColumnOptions => {
  const series: Highcharts.SeriesColumnOptions = {
    type: "column",
    data: totalLifeYearsCost.value?.children?.map((subCost, columnIndex) => {
      return {
        y: getValueFromCost(subCost, LIFE_YEARS_METRIC),
        name: appStore.getCostLabel(subCost?.id || ""),
        color: columnColors.value[columnIndex],
        custom: {
          dollarAmountInMillions: getValueFromCost(subCost, USD_METRIC) || 0,
        },
      };
    }) || [],
  };

  seriesData.value = series;
  return series;
};

const costLabels = computed(() => totalLifeYearsCost.value?.children?.map(cost => appStore.getCostLabel(cost.id)) || []);

const chartHeightPx = 300;

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
      filename: `Life years lost in ${appStore.currentScenario.parameters?.country}`,
      chartOptions: {
        title: {
          text: `Life years lost in ${appStore.currentScenario.parameters?.country}`,
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
        text: costsChartYAxisTitle(LIFE_YEARS_METRIC),
      },
      stackLabels: {
        enabled: true,
        formatter() {
          return costsChartSingleScenarioStackLabelFormatter(this.total, LIFE_YEARS_METRIC);
        },
      },
      labels: {
        enabled: true,
        formatter() {
          return costsChartYAxisTickFormatter(this.value, LIFE_YEARS_METRIC);
        },
      },
    },
    series: [getSeries()],
    legend: {
      enabled: false,
    },
    tooltip: {
      formatter() {
        return costsChartSingleScenarioLifeYearsTooltip(this);
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

watch([chartContainer, totalLifeYearsCost], () => {
  if (totalLifeYearsCost.value && !chart && chartContainer.value) {
    chart = Highcharts.chart("lifeYearsChartContainer", chartInitialOptions());
  }
});

const setChartDimensions = debounce(() => {
  if (chart && chartParentEl.value) {
    chart.setSize(chartParentEl.value.clientWidth, chartHeightPx, { duration: 250 });
  }
});

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
#lifeYearsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries
}
</style>
