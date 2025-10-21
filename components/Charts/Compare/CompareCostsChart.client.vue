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

import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, getColorVariants, menuItemDefinitionOptions } from "@/components/utils/charts";
import { costsChartMultiScenarioStackedTooltip, costsChartMultiScenarioUnstackedTooltip, costsChartMultiScenarioXAxisLabelFormatter, costsChartPalette, costsChartStackLabelFormatter, costsChartYAxisTickFormatter, costsChartYAxisTitle } from "~/components/Charts/utils/costCharts";
import { costAsPercentOfGdp } from "@/components/utils/formatters";
import { CostBasis } from "@/types/unitTypes";
import { debounce } from "perfect-debounce";

const props = defineProps<{
  stacked: boolean
  allowGrandchildCosts: boolean
}>();

const appStore = useAppStore();
let chart: Highcharts.Chart;
const showGrandchildCosts = computed(() => !props.stacked && props.allowGrandchildCosts);
const seriesData = ref<Array<Highcharts.SeriesColumnOptions | Highcharts.SeriesScatterOptions>>([]); // This only exists for testing purposes
const chartContainer = ref<HTMLElement | null>(null);
const chartParentEl = computed(() => chartContainer.value?.parentElement);
const scenarios = computed(() => appStore.currentComparison.scenarios);
const costBasis = computed(() => appStore.preferences.costBasis);
const chartTitle = computed(() => {
  const firstScenarioTimeSeries = appStore.currentComparison.scenarios[0].result?.data?.time_series;
  const scenarioDuration = Object.values(firstScenarioTimeSeries || {})[0].length - 1;
  return `Losses after ${scenarioDuration} days`;
});

// A scatter series to be shown when costs are not stacked to indicate the total cost for each scenario.
const totalSeries = (): Highcharts.SeriesScatterOptions => ({
  type: "scatter",
  name: "Total",
  color: "black",
  marker: {
    symbol: "circle",
  },
  data: scenarios.value.map((scenario) => {
    const totalCost = scenario.result.data?.costs[0].value || 0;
    const totalAsGdpPercent = costAsPercentOfGdp(totalCost, scenario.result.data?.gdp);
    const y = costBasis.value === CostBasis.PercentGDP ? totalAsGdpPercent : totalCost;
    return { y };
  }),
});

// There are 3 levels of data breakdown for costs:
// 1) the top-level total for the scenario,
// 2) the second level, GDP/life-years/education,
// 3) and a further breakdown, e.g. absences/closures in the cases of GDP and education.
// Series are orthogonal to columns, and here correspond to the second-level breakdowns.
// Each series' data is an array of each scenario's cost for that breakdown.
// For example, one series should comprise each scenario's GDP.
const columnSeries = (): Array<Highcharts.SeriesColumnOptions> => {
  // Take the first scenario's costs as an example to find out what the second-level breakdowns are.
  const secondLevelCostIds = appStore.getScenarioTotalCost(scenarios.value[0])?.children?.map(c => c.id);
  return secondLevelCostIds?.map((costId, index) => ({
    type: "column",
    name: appStore.getCostLabel(costId),
    borderWidth: 1,
    borderColor: costsChartPalette[index].rgb,
    zIndex: secondLevelCostIds.length - index, // Ensure that stack segments are in front of each other from top to bottom.
    data: scenarios.value.map((scenario) => {
      const subCost = scenario.result.data?.costs[0].children?.find(c => c.id === costId);
      const dollarAmount = getDollarValueFromCost(subCost);
      // costAsGdpPercent is calculated here since the national GDP may vary by scenario if the axis is 'country'.
      const costAsGdpPercent = costAsPercentOfGdp(dollarAmount, scenario.result.data?.gdp);
      const y = costBasis.value === CostBasis.PercentGDP ? costAsGdpPercent : dollarAmount;
      const name = appStore.getCostLabel(subCost?.id || "");
      return {
        y,
        name,
        custom: { costAsGdpPercent },
      };
    }),
  } as Highcharts.SeriesColumnOptions)) || [];
};

// There are 3 levels of data breakdown for costs:
// 1) the top-level total for the scenario,
// 2) the second level, GDP/life-years/education,
// 3) and a further breakdown, e.g. absences/closures in the cases of GDP and education.
// Series are orthogonal to columns, and here correspond to the third-level breakdowns.
// Each series' data is an array of each scenario's cost for that breakdown.
// For example, one series should comprise each scenario's GDP.
const columnSeriesForGrandchildCosts = (): Array<Highcharts.SeriesColumnOptions> => {
  // Take the first scenario's costs as an example to find out what the third-level breakdowns are.
  // Then, create a dictionary where the keys are the third-level breakdown ids,
  // and the values contain (1) the mapping to the second-level so that we can tell the
  // third-level costs which stacks they belong to, and (2) the color to use for that third-level cost.
  const exampleTotalCost = appStore.getScenarioTotalCost(scenarios.value[0]);
  const grandchildDetails = exampleTotalCost?.children!.reduce((acc, child, index) => {
    const childColors = getColorVariants(costsChartPalette[index], exampleTotalCost.children!.length);
    child.children?.forEach((grandchild, index) => {
      acc[grandchild.id] = {
        parent: child.id,
        color: childColors[index],
      };
    });
    return acc;
  }, {} as Record<string, { parent: string, color: string }>) || {};
  return Object.entries(grandchildDetails).map(([grandchildId, { parent, color }]) => {
    const siblingsAndSelf = Object.entries(grandchildDetails).filter(([_k, details]) => details.parent === parent);
    const indexInStack = siblingsAndSelf.findIndex(([k]) => k === grandchildId);
    return {
      type: "column",
      name: appStore.getCostLabel(grandchildId),
      // borderWidth: 1,
      // borderColor: color,
      stack: parent, // Stack by the second-level cost.
      zIndex: siblingsAndSelf.length - indexInStack, // Ensure that stack segments are in front of each other from top to bottom.
      data: scenarios.value.map((scenario) => {
        const totalCost = appStore.getScenarioTotalCost(scenario);
        const flatCosts = totalCost!.children?.flatMap(c => c.children || []) || [];
        const grandchildCost = flatCosts.find(c => c.id === grandchildId);
        const dollarValue = grandchildCost?.value;
        // costAsGdpPercent is calculated here since the national GDP may vary by scenario if the axis is 'country'.
        const costAsGdpPercent = costAsPercentOfGdp(dollarValue, scenario.result.data?.gdp);
        const y = costBasis.value === CostBasis.PercentGDP ? costAsGdpPercent : dollarValue;
        const name = appStore.getCostLabel(grandchildCost?.id || "");
        return {
          y,
          color,
          name,
          custom: { costAsGdpPercent },
        };
      }),
    } as Highcharts.SeriesColumnOptions;
  });
};

// When stacked is enabled, only the second level is displayed in the chart.
const getSeries = (): Array<Highcharts.SeriesColumnOptions | Highcharts.SeriesScatterOptions> => {
  const columns = showGrandchildCosts.value ? columnSeriesForGrandchildCosts() : columnSeries();
  console.log("columns", columns);
  seriesData.value = props.stacked ? columns : [...columns, totalSeries()];
  return seriesData.value;
};

const chartHeightPx = 500;
const rowPadding = 12;
const targetWidth = () => {
  return chartParentEl.value ? chartParentEl.value.clientWidth - (2 * rowPadding) : 0;
};

const stackingOption = computed(() => (props.stacked || showGrandchildCosts.value ? "normal" : undefined));

const chartInitialOptions = () => {
  return {
    credits: { text: "Highcharts" },
    colors: costsChartPalette.map(color => color.rgb),
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
      min: 0,
      title: { text: costsChartYAxisTitle(costBasis.value) },
      stackLabels: {
        enabled: props.stacked,
        formatter() {
          return costsChartStackLabelFormatter(this.total, costBasis.value);
        },
      },
      labels: {
        enabled: true,
        formatter() {
          return costsChartYAxisTickFormatter(this.value, costBasis.value);
        },
      },
    },
    series: getSeries(),
    legend: { enabled: false },
    tooltip: {
      shared: props.stacked,
      formatter() {
        if (props.stacked) {
          return costsChartMultiScenarioStackedTooltip(this, costBasis.value, appStore.axisMetadata);
        } else {
          return costsChartMultiScenarioUnstackedTooltip(this, costBasis.value, appStore.axisMetadata);
        }
      },
    },
    plotOptions: {
      column: {
        stacking: stackingOption.value,
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
  chart?.update({
    yAxis: { title: { text: costsChartYAxisTitle(costBasis.value) } },
    series: getSeries(),
  });
});

watch(() => [props.stacked, showGrandchildCosts.value, stackingOption.value], () => {
  const newSeries = getSeries();

  // Since the number of series will change, we have to manually remove and add series.
  chart?.series.forEach((oldSeries) => {
    if (!newSeries.map(newS => newS.name).includes(oldSeries.name)) {
      oldSeries.remove(false);
    }
  });
  newSeries.forEach((newS) => {
    if (!chart?.series.map(oldS => oldS.name).includes(newS.name!)) {
      chart?.addSeries(newS, false);
    }
  });

  chart.yAxis[0].update({
    stackLabels: { enabled: props.stacked },
  }, false);

  chart?.update({
    plotOptions: { column: { stacking: stackingOption.value } },
  });
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
