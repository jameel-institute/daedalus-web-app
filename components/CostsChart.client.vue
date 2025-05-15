<template>
  <div
    :id="chartContainerId"
    ref="chartContainer"
    :class="[props.hideTooltips ? hideTooltipsClassName : '']"
    :data-summary="JSON.stringify(costsData)"
  />
</template>

<script lang="ts" setup>
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";

import exportDataInitialize from "highcharts/modules/export-data";
import exportingInitialize from "highcharts/modules/exporting";
import offlineExportingInitialize from "highcharts/modules/offline-exporting";

import throttle from "lodash.throttle";
import { colorBlindSafeColors, costsChartTooltipText, getColorVariants } from "./utils/highCharts";

const props = defineProps<{
  hideTooltips: boolean
  isGdp: boolean
}>();

accessibilityInitialize(Highcharts);

exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);
offlineExportingInitialize(Highcharts);

const sharedTooltips = false;

const appStore = useAppStore();
const chartContainerId = "costsChartContainer";
const hideTooltipsClassName = "hide-tooltips";
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";
let chart: Highcharts.Chart;
const costsData = ref([]); // This is only implemented as ref for testing purposes, via the data-summary attribute.
const chartWidth = computed(() => appStore.largeScreen ? 700 : 600);
const chartHeight = computed(() => appStore.largeScreen ? 450 : 300);
const chartContainer = ref<HTMLElement | null>(null);

// There are 3 levels of data breakdown for costs: total, GDP/life-years/education, and a further breakdown.
// The levels are 'ragged' - i.e. not all items on a level will have the same number of children as each other.
// We don't display the top level in the chart.
// Each column corresponds to a second-level cost, and the third level is shown as a stacked break-down within the column.
// Since Highchart treats series as the fundamental concept, and series are orthogonal to columns,
// we have to wrangle our data to match, as well as implement color logic and legend logic ourselves.
const getSeries = (): Highcharts.SeriesColumnOptions[] | undefined => {
  // We need as many series as there are breakdowns in the most broken-down column.
  const numberOfSeries = appStore.totalCost?.children?.reduce((max, cost) => {
    return Math.max(max, cost.children?.length || 0);
  }, 0) || 0;

  // Each series' data is an array of each second-level cost's Nth child.
  // For example, the first series should comprise the first child of GDP, first child of life-years, and the first child of education.
  const series: Highcharts.SeriesColumnOptions[] = [];
  for (let stackRowIndex = 0; stackRowIndex < numberOfSeries; stackRowIndex++) {
    series.push({
      type: "column",
      data: appStore.totalCost?.children?.map((cost, columnIndex) => {
        const subCost = cost.children?.[stackRowIndex];
        // If we did not care about varying the colors within the column, we could just use the 'colorByPoint' option.
        const columnBaseColor = colorBlindSafeColors[columnIndex].hex;
        const colorVariants = getColorVariants(columnBaseColor, Math.max(cost.children?.length || 1));
        // If there is no Nth child for some cost, we still need to create a breakdown for the stack with a y-value of 0,
        // to ensure that any subsequent data points will belong to the correct column.

        const valueInDollarTerms = subCost?.value || 0;
        const value = props.isGdp ? (valueInDollarTerms / appStore.currentScenario.result.data!.gdp) * 100 : valueInDollarTerms;

        return {
          y: value,
          name: appStore.getCostLabel(subCost?.id || ""),
          color: colorVariants[stackRowIndex],
        };
      }) || [],
    });
  }

  return series;
};

const yAxisOptions = () => {
  return {
    min: 0,
    title: {
      text: props.isGdp ? "Losses as % of 2018 national GDP" : "Losses in billions USD",
    },
    stackLabels: {
      enabled: true,
      formatter: props.isGdp
        ? function () {
          return `${this.total.toFixed(1)}% of GDP`;
        }
        : function () {
          const abbr = abbreviateMillionsDollars(this.total, 1);
          return `$${abbr.amount} ${abbr.unit}`;
        },
    },
    labels: {
      formatter: props.isGdp
        ? function () {
          return `${this.value}%`;
        }
        : function () {
          const abbr = expressMillionsDollarsAsBillions(this.value as number, 0, true);
          return `${abbr.amount}`;
        },
    },
  } as Highcharts.YAxisOptions;
};

const tooltipOptions = () => {
  return {
    shared: sharedTooltips, // TODO: toggle this (and below distance) for scientist demo. https://www.highcharts.com/docs/chart-concepts/tooltip
    distance: sharedTooltips ? 128 : undefined, // necessary for SHARED tooltips to not obscure stack labels or stack-blocks.
    formatter: props.isGdp
      ? function (this) {
        return costsChartTooltipText(this, true, sharedTooltips, appStore.currentScenario.result.data!.gdp);
      }
      : function (this) {
        return costsChartTooltipText(this, false, sharedTooltips, appStore.currentScenario.result.data!.gdp);
      },
  } as Highcharts.TooltipOptions;
};

const chartInitialOptions = () => {
  return {
    credits: {
      text: "Highcharts",
    },
    chart: {
      // spacing: [0, 0, 0, 0],
      height: chartHeight.value,
      width: chartWidth.value,
      backgroundColor: chartBackgroundColor,
      events: {
        fullscreenOpen() {
          this.update({ chart: { backgroundColor: chartBackgroundColorOnExporting } });
        },
        fullscreenClose() {
          this.update({ chart: { backgroundColor: chartBackgroundColor } });
        },
      },
      style: {
        fontFamily: "ImperialSansText, sans-serif", // TODO: Make the font-family derive from a globally configurable constant
      },
    },
    exporting: {
      // TODO: update filename/title/subtitle.
      filename: `Losses in ${appStore.currentScenario.parameters?.country}`,
      chartOptions: {
        title: {
          text: `Losses in ${appStore.currentScenario.parameters?.country}`,
        },
        // subtitle: {
        //   text: seriesMetadata.value!.description,
        // },
        chart: {
          backgroundColor: chartBackgroundColorOnExporting,
          height: 500, // TODO.
        },
      },
      buttons: {
        contextButton: {
          height: 20,
          width: 22,
          symbolSize: 12,
          symbolY: 10,
          symbolX: 12,
          symbolStrokeWidth: 2,
          // Omit 'printChart' and 'viewData' from menu items
          menuItems: ["downloadCSV", "downloadXLS", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "viewFullscreen"],
          useHTML: true,
        },
      },
      menuItemDefinitions: {
        downloadCSV: {
          text: "Download CSV for this chart",
        },
        downloadXLS: {
          text: "Download XLS for this chart",
        },
      },
    },
    title: {
      text: "",
      style: {
        color: "white",
      },
    },
    xAxis: {
      categories: appStore.totalCost?.children?.map(cost => appStore.getCostLabel(cost.id)),
    },
    yAxis: yAxisOptions(),
    series: getSeries(), // Empty at initialisation, populated later. TODO: see if there is a reason for doing it like that.
    legend: {
      enabled: false,
    },
    tooltip: tooltipOptions(),
    plotOptions: {
      column: {
        colorByPoint: true, // Colors accrue to (stacked) columns, not to series (which are orthogonal to columns)
        // borderRadius: 0,
        // borderWidth: 0.5,
        // cursor: "pointer",
        dataLabels: {
          // formatter() {
          //   if (this.point.index === 0) {
          //     return "Losses";
          //   } else {
          //     return this.point.name;
          //   };
          // },
          // style: defaultDataLabelStyle,
          allowOverlap: false,
        },
        stacking: "normal",
        groupPadding: 0.05,
        // animation: false,
      } as Highcharts.SeriesColumnOptions,
    },
  } as Highcharts.Options;
};

// TODO - restore these functions if it seems to be needed.
// const populateCostsDataIntoPie = () => {
//   if (!appStore.totalCost) {
//     return;
//   }

//   const series = getSeries();

//   chart.series[0].setData(costsData.value);
// };
// watch(() => appStore.costsData, () => {
//   if (appStore.costsData) {
//     populateCostsDataIntoPie();
//   }
// });

watch(() => appStore.largeScreen, throttle(() => {
  if (chart) {
    chart.setSize(chartWidth.value, chartHeight.value, { duration: 250 });
  }
}, 25));

watch(() => chartContainer.value, () => {
  if (appStore.costsData && !chart && chartContainer.value) {
    // TODO - for tests.
    // costsData.value = series?.map(series => series.data?.map((point) => point?.y));
    chart = Highcharts.chart(chartContainerId, chartInitialOptions());
  }
});

// watch the isGdp prop
watch(() => props.isGdp, () => {
  if (chart) {
    chart.update({
      yAxis: yAxisOptions(),
      series: getSeries(),
      tooltip: tooltipOptions(),
    });
  }
});

onUnmounted(() => {
  // Destroy this chart, otherwise every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser.
  chart.destroy();
});
</script>

<style lang="scss">
#costsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries

  .highcharts-tooltip {
    transition: filter 0.2s;
  }

  &.hide-tooltips {
    .highcharts-tooltip {
      filter: opacity(0);
    }
  }

  .highcharts-point {
    opacity: 1 !important; // Avoid transparency on hover over pie slices
  }

  .highcharts-container {
    margin-left: auto;
  }
}
</style>
