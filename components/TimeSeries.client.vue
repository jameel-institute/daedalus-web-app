<template>
  <div
    :id="chartContainerId"
    ref="chartContainer"
    class="chart-container time-series"
    :style="{ zIndex, height: 'fit-content' }"
    :data-summary="JSON.stringify({ firstDataPoint: data[0], lastDataPoint: data[data.length - 1], dataLength: data.length })"
  />
</template>

<script setup lang="ts">
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/accessibility";
import "highcharts/esm/modules/exporting";
import "highcharts/esm/modules/export-data";
import "highcharts/esm/modules/offline-exporting";
import { debounce } from "perfect-debounce";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesDataPoint } from "~/types/dataTypes";
import { chartBackgroundColorOnExporting, chartOptions, contextButtonOptions, menuItemDefinitionOptions, plotBandsColor, plotLinesColor, timeSeriesColors } from "./utils/highCharts";

const props = defineProps<{
  seriesId: string
  seriesIndex: number // Probably 0 or 1 as time series come in pairs
  groupIndex: number // Probably 0 to about 4
  yUnits: string
  chartHeight: number
  seriesRole: string
}>();

const emit = defineEmits<{
  chartCreated: [seriesId: string, chartIndex: number]
  chartDestroyed: [seriesId: string]
}>();

const appStore = useAppStore();

// Get a unique index for this series, across all groups and series
const uniqueSeriesIndex = props.groupIndex * 2 + props.seriesIndex;
// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.timeSeriesData!).length - uniqueSeriesIndex) + 3;
const chartContainerId = computed(() => `${props.seriesId}-container`);

const chartContainer = ref<HTMLDivElement | null>(null);

let chart: Highcharts.Chart;

const seriesMetadata = computed((): DisplayInfo | undefined => {
  return appStore.metadata?.results?.time_series.find(({ id }) => id === props.seriesId);
});

// Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
const data = computed((): TimeSeriesDataPoint[] => {
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

const chartInitialOptions = () => {
  return {
    credits: {
      enabled: false, // Omit credits to allow us to reduce margin and save vertical space on page. We must credit Highcharts elsewhere.
    },
    chart: {
      ...chartOptions,
      height: props.chartHeight,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
      marginBottom: 35,
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
        contextButton: contextButtonOptions,
      },
      menuItemDefinitions: menuItemDefinitionOptions,
    },
    title: {
      text: "",
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
    emit("chartCreated", props.seriesId, chart.index);
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
}

.accordion.time-series {
  .collapsing {
    transition: height .2s ease;
  }

  .accordion-body { // These are the default values from CoreUI, but we need to pin them so that our const accordionBodyYPadding is correct.
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  .accordion-button {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
    color: var(--cui-black) !important;
    background-color: var(--cui-light) !important;
    border-radius: 0 !important;
  }

  .accordion-item {
    background: $light-background;
  }
}
</style>
