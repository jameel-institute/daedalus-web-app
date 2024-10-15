<template>
  <!-- Per each time series, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
  <CAccordion
    :style="accordionStyle"
    class="time-series"
    :active-item-key="props.open ? props.seriesId : undefined"
  >
    <CAccordionItem :item-key="seriesId" class="border-0">
      <CAccordionHeader class="border-top" @click="handleAccordionToggle">
        <span aria-describedby="labelDescriptor">{{ seriesMetadata?.label }}</span>
        <span id="labelDescriptor" class="visually-hidden">{{ seriesMetadata?.description }}</span>
        <CTooltip
          v-if="seriesMetadata?.description"
          :content="seriesMetadata.description"
          placement="top"
        >
          <template #toggler="{ togglerId, on }">
            <CIconSvg class="icon opacity-50 ms-2">
              <img src="~/assets/icons/circleQuestion.svg" :aria-describedby="togglerId" v-on="on">
            </CIconSvg>
          </template>
        </CTooltip>
      </CAccordionHeader>
      <CAccordionBody>
        <div
          :id="chartContainerId"
          :class="`chart-container time-series ${props.hideTooltips ? hideTooltipsClassName : ''}`"
          :style="{ zIndex, height: 'fit-content' }"
          @mousemove="onMove"
          @touchmove="onMove"
          @touchstart="onMove"
          @mouseleave="handleMouseLeave"
          @mouseover="handleMouseOver"
        />
      </CAccordionBody>
    </CAccordionItem>
  </CAccordion>
</template>

<script lang="ts" setup>
import { CIconSvg } from "@coreui/icons-vue";
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
  index: number
  open: boolean
  hideTooltips: boolean
  chartHeightPx: number
  minChartHeightPx: number
}>();

const emit = defineEmits([
  "hideAllTooltips",
  "showAllTooltips",
  "syncTooltipsAndCrosshairs",
  "toggleOpen",
  "chartCreated",
  "chartDestroyed",
]);
accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);
offlineExportingInitialize(Highcharts);

const appStore = useAppStore();

let chart: Highcharts.Chart;
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";
const hideTooltipsClassName = "hide-tooltips";
const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
};
// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.timeSeriesData!).length - props.index) + 3;
const yUnits = props.seriesId === "dead" ? "deaths" : "cases"; // TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
const chartContainerId = computed(() => `${props.seriesId}-container`);
// Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
const data = computed(() => {
  return appStore.timeSeriesData![props.seriesId].map((value, index) => [index + 1, value]);
});
const seriesMetadata = computed((): DisplayInfo | undefined => {
  return appStore.metadata?.results?.time_series.find(({ id }) => id === props.seriesId);
});
const usePlotLines = props.seriesId === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const usePlotBands = props.seriesId === "hospitalised" || props.seriesId === "prevalence"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
// The y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range. This way the
// plotLines remain visible even when the maximum data value is less than the maximum plotline value.
const minRange = computed(() => {
  if (usePlotLines) {
    return appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0);
  } else {
    return undefined;
  }
});
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

  if (!usePlotBands) {
    return bands;
  }

  appStore.interventionsData?.forEach(({ start, end }) => {
    bands.push({ from: start, to: end, color: plotBandsColor });
  });

  return bands;
});

const handleAccordionToggle = () => {
  emit("toggleOpen");
};

const onMove = () => {
  emit("syncTooltipsAndCrosshairs");
};

const handleMouseLeave = () => {
  emit("hideAllTooltips");
};

const handleMouseOver = () => {
  emit("showAllTooltips");
};

// Override the reset function as per synchronisation demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
// Seems to be required in order for tooltips to hang around more than about a second.
Highcharts.Pointer.prototype.reset = () => {
  return undefined;
};

const setChartHeight = debounce(async (height: number) => {
  chart.setSize(undefined, height, { duration: 250 });
}, 10);

// Resize the chart when the accordion is opened or closed.
watch(() => [props.chartHeightPx, props.open], () => {
  setChartHeight((props.open ? props.chartHeightPx : props.minChartHeightPx));
});

const chartInitialOptions = () => {
  return {
    chart: {
      height: props.chartHeightPx,
      marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
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
      pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${yUnits}`,
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
      type: "area",
      color: timeSeriesColors[props.index],
      fillOpacity: 0.3,
      tooltip: {
        valueSuffix: ` ${props.seriesId === "vaccination" ? "%" : ""}`, // TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
      },
      marker: {
        enabled: false,
      },
    }],
  } as Highcharts.Options;
};

onMounted(() => {
  chart = Highcharts.chart(chartContainerId.value, chartInitialOptions());
  emit("chartCreated", props.seriesId, chart);
});

onUnmounted(() => {
  emit("chartDestroyed", props.seriesId);

  // Destroy this chart, since every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser if they aren't disposed of.
  chart.destroy();
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

.accordion.time-series {
  .collapsing {
    transition: height .2s ease;
  }

  .accordion-body { // These are the default values from CoreUI, but we need to pin them so that our const accordionBodyYPadding is correct.
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  .accordion-button {
    color: var(--cui-black) !important;
    background-color: var(--cui-light) !important;
  }

  .accordion-item {
    background: rgba(255, 255, 255, 0.5);
  }
}
</style>
