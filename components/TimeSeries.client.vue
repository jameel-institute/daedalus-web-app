<template>
  <div
    :id="chartContainerId"
    ref="chartContainer"
    :class="`chart-container time-series ${props.hideTooltips ? 'hide-tooltips' : ''}`"
    :style="{ zIndex, height: 'fit-content' }"
  />
</template>

<script setup lang="ts">
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import exportDataInitialize from "highcharts/modules/export-data";
import exportingInitialize from "highcharts/modules/exporting";
import offlineExportingInitialize from "highcharts/modules/offline-exporting";

import { debounce } from "perfect-debounce";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import { plotBandsColor, plotLinesColor, timeSeriesColors } from "./utils/charts";

const props = defineProps<{
  seriesId: string
  hideTooltips: boolean
  seriesIndex: number // Probably 0 or 1 as time series come in pairs
  groupIndex: number // Probably 0 to about 4
  yUnits: string
  chartHeight: number
  seriesRole: string
}>();

const emit = defineEmits<{
  chartCreated: [seriesId: string, chart: Highcharts.Chart]
  chartDestroyed: [seriesId: string]
}>();

accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);
offlineExportingInitialize(Highcharts);

const appStore = useAppStore();

// Get a unique index for this series, across all groups and series
const uniqueSeriesIndex = props.groupIndex * 2 + props.seriesIndex;
// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.timeSeriesData!).length - uniqueSeriesIndex) + 3;
const chartContainerId = computed(() => `${props.seriesId}-container`);

const chartContainer = ref<HTMLDivElement | null>(null);

let chart: Highcharts.Chart;
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";

const seriesMetadata = computed((): DisplayInfo | undefined => {
  return appStore.metadata?.results?.time_series.find(({ id }) => id === props.seriesId);
});

// Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
const data = computed(() => {
  return appStore.timeSeriesData![props.seriesId].map((value, index) => [index + 1, value]);
});

const usePlotLines = props.seriesId === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/

// The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
// plotLines remain visible even when the maximum data value is less than the maximum plotline value.
const minRange = computed(() => usePlotLines
  ? appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0)
  : undefined);

const capacitiesPlotLines = computed(() => {
  const lines = new Array<Highcharts.AxisPlotLinesOptions>();

  if (!usePlotLines) {
    return lines;
  }

  appStore.capacitiesData?.forEach(({ id, value }) => {
    const capacityLabel = appStore.metadata?.results.capacities.find(({ id: capacityId }) => capacityId === id)?.label;

    lines.push({
      color: plotLinesColor,
      label: {
        text: `${capacityLabel}: ${value}`,
        style: {
          color: plotLinesColor,
        },
      },
      width: 2,
      value,
      zIndex: 4, // Render plot line and label in front of the series line
    });
  });

  return lines;
});

const interventionsPlotBands = computed(() => {
  const bands = new Array<Highcharts.AxisPlotBandsOptions>();
  const usePlotBands = ["hospitalised", "new_hospitalised", "prevalence", "new_infected"].includes(props.seriesId); // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
  if (!usePlotBands) {
    return bands;
  }

  appStore.interventionsData?.forEach(({ start, end }) => {
    bands.push({ from: start, to: end, color: plotBandsColor });
  });

  return bands;
});

// Override the reset function as per synchronisation demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
// Seems to be required in order for tooltips to hang around more than about a second.
Highcharts.Pointer.prototype.reset = () => {
  return undefined;
};

const chartInitialOptions = () => {
  return {
    credits: {
      enabled: false, // Omit credits to allow us to reduce margin and save vertical space on page. We must credit Highcharts elsewhere.
    },
    chart: {
      height: props.chartHeight,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 35,
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
      filename: `${seriesMetadata.value!.label} in ${appStore.currentScenario.parameters?.country}`,
      chartOptions: {
        title: {
          text: seriesMetadata.value!.label,
        },
        subtitle: {
          text: seriesMetadata.value!.description,
        },
        chart: {
          backgroundColor: chartBackgroundColorOnExporting,
          height: 500,
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
        fontWeight: "500",
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      headerFormat: "<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>",
      pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${props.yUnits}`,
      valueDecimals: 0,
    },
    xAxis: { // Omit title to save vertical space on page
      crosshair: true,
      plotBands: interventionsPlotBands.value,
      minTickInterval: 1,
      min: 1,
    },
    yAxis: {
      title: {
        text: "",
      },
      min: 0,
      minRange: minRange.value,
      plotLines: capacitiesPlotLines.value,
    },
    series: [{
      data: data.value,
      name: seriesMetadata.value!.label,
      type: props.seriesRole === "total" ? "area" : "line",
      color: timeSeriesColors[props.groupIndex],
      fillOpacity: 0.3,
      marker: {
        enabled: false,
      },
    }],
  } as Highcharts.Options;
};

watch(() => chartContainer.value, () => {
  if (!chart) {
    chart = Highcharts.chart(chartContainerId.value, chartInitialOptions());
    emit("chartCreated", props.seriesId, chart);
  }
});

onUnmounted(() => {
  emit("chartDestroyed", props.seriesId);
  // Destroy this chart, since every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser if they aren't disposed of.
  chart.destroy();
});

const setChartHeight = debounce(async (height: number) => {
  chart.setSize(undefined, height, { duration: 250 });
}, 10);

watch(() => props.chartHeight, () => {
  setChartHeight(props.chartHeight);
});
</script>

<style lang="scss">
.chart-container.time-series {
  width: 100%;
  position: relative; /* Required for z-index to work */
  left: -20px;

  &.hide-tooltips {
    .highcharts-tooltip, .highcharts-tracker, .highcharts-crosshair {
      filter: opacity(0);
      transition: filter 0.2s;
    }
  }
}
</style>
