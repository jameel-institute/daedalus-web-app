<template>
  <!-- Per each time series, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
  <CAccordion
    :style="accordionStyle"
    :active-item-key="isOpen ? props.seriesId : undefined"
  >
    <CAccordionItem :item-key="seriesId" class="border-0">
      <CAccordionHeader class="border-top" @click="handleAccordionToggle">
        {{ seriesMetadata?.label }}
      </CAccordionHeader>
      <CAccordionBody>
        <div
          :id="containerId"
          :class="`chart-container ${props.hideTooltips ? hideTooltipsClassName : ''}`"
          :style="{ zIndex, height: 'fit-content' }"
          @mousemove="onMove"
          @touchmove="onMove"
          @touchstart="onMove"
        />
      </CAccordionBody>
    </CAccordionItem>
  </CAccordion>
</template>

<script lang="ts" setup>
import throttle from "lodash.throttle";
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import exportingInitialize from "highcharts/modules/exporting";
import exportDataInitialize from "highcharts/modules/export-data";
import offlineExportingInitialize from "highcharts/modules/offline-exporting";

import { highchartsColors, plotBandsColor, plotLinesColor } from "./utils/charts";
import type { DisplayInfo } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesId: string
  index: number
  openedAccordions: string[]
  hideTooltips: boolean
}>();

const emit = defineEmits(["toggleOpen"]);
accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);
offlineExportingInitialize(Highcharts);

const appStore = useAppStore();

let chart: Highcharts.Chart;
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";
const hideResetZoomButtonClassName = "hide-reset-zoom-button";
const hideTooltipsClassName = "hide-tooltips";
const accordionBodyYPadding = 8;
const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
};
// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.timeSeriesData!).length - props.index) + 3;
const yUnits = props.seriesId === "dead" ? "deaths" : "cases"; // TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
const minAccordionHeight = 150;
const minTotalAccordionHeight = 500;

const isOpen = computed(() => props.openedAccordions.includes(props.seriesId));
const maxTotalAccordionHeight = computed(() => {
  if (appStore.timeSeriesData) { // Allow at least minAccordionHeight for each accordion
    return Math.max(minTotalAccordionHeight, (Object.keys(appStore.timeSeriesData!).length * minAccordionHeight));
  } else {
    return minTotalAccordionHeight;
  }
});
// Share available height equally between open accordions
const containerHeightPx = computed(() => maxTotalAccordionHeight.value / props.openedAccordions.length);
const containerId = computed(() => `${props.seriesId}-container`);
// Assign an x-position to y-values. Nth value corresponds to "N+1th day" of simulation.
const data = computed(() => {
  return appStore.timeSeriesData![props.seriesId].map((value, index) => [index + 1, value]);
});
const seriesMetadata = computed((): DisplayInfo | undefined => {
  return appStore.metadata?.results?.time_series.find(({ id }) => id === props.seriesId);
});
const usePlotLines = props.seriesId === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const usePlotBands = props.seriesId === "hospitalised" || props.seriesId === "infect"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
// On zooming, the y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' ability to rescale, by defining a minimum range.
const minRange = computed(() => {
  if (usePlotLines) {
    return appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0);
  } else {
    return undefined;
  }
});
const capacitiesPlotLines = computed(() => {
  const lines = Array<Highcharts.AxisPlotLinesOptions>();

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
  const bands = Array<Highcharts.AxisPlotBandsOptions>();

  if (!usePlotBands) {
    return bands;
  }

  appStore.interventionsData?.forEach(({ id, start, end }) => {
    const interventionLabel = appStore.metadata?.results.interventions.find(({ id: interventionId }) => interventionId === id)?.label;
    const text = `${interventionLabel ? `${interventionLabel} : ` : ""}Days ${start} to ${end}`;
    bands.push({ from: start, to: end, color: plotBandsColor, label: { text } });
  });

  return bands;
});

const allCharts = computed(() => {
  // Excludes undefineds. When a chart is destroyed, Highcharts.charts retains its index, but the value is undefined.
  return Array.from(Highcharts.charts).filter(chart => chart) as (Highcharts.Chart)[];
});

const handleAccordionToggle = () => {
  emit("toggleOpen");
};

const minChartHeight = minAccordionHeight - (2 * accordionBodyYPadding);
const chartHeight = () => (containerHeightPx.value - (2 * accordionBodyYPadding));

/**
 * Synchronize tooltips and crosshairs between charts.
 * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
 */
const syncTooltipsAndCrosshairs = throttle(() => {
  if (chart.hoverPoint) {
    allCharts.value.forEach(({ series }) => {
      // Get the point with the same x as the hovered point
      const point = series[0].getValidPoints().find(({ x }) => x === chart.hoverPoint!.x);

      if (point && point !== chart.hoverPoint) {
        point.onMouseOver();
      }
    });
  };
}, 100, { leading: true });

const onMove = () => syncTooltipsAndCrosshairs();

// Override the reset function as per synchronisation demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
Highcharts.Pointer.prototype.reset = () => {
  return undefined;
};

// Synchronize zooming through the setExtremes event handler.
const syncExtremes = (event: { trigger: string, min: number | undefined, max: number | undefined }) => {
  if (event.trigger !== "syncExtremes") {
    allCharts.value.forEach((ch: Highcharts.Chart) => {
      if (ch.xAxis[0].setExtremes) { // setExtremes is null while updating
        ch.xAxis[0].setExtremes(event.min, event.max, undefined, { duration: 250 }, { trigger: "syncExtremes" });
        if (event.min && event.max) {
          // Prevent exporting while zoomed in since image export doesn't work well when zoomed in
          ch.update({ chart: { className: undefined }, exporting: { enabled: false } });
        } else {
          ch.update({ chart: { className: hideResetZoomButtonClassName }, exporting: { enabled: true } });
        }
      }
    });
  }
};

const chartInitialOptions = () => {
  return {
    chart: {
      height: chartHeight(),
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
      className: hideResetZoomButtonClassName,
      style: {
        fontFamily: "ImperialSansText, sans-serif", // TODO: Make the font-family derive from a globally configurable constant
      },
      zooming: {
        type: "x",
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
      events: {
        setExtremes: syncExtremes,
      },
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
      color: highchartsColors[props.index],
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
  chart = Highcharts.chart(containerId.value, chartInitialOptions());

  // Create the reset zoom button, initially hidden by the className "hide-reset-zoom-button".
  // Using a CSS class to toggle visibility is much more performant than using this method each time.
  chart.showResetZoom();
});

onUnmounted(() => {
  // Destroy this chart, otherwise every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser.
  chart.destroy();
});

watch(() => props.openedAccordions, () => {
  if (isOpen.value) {
    chart.setSize(undefined, chartHeight(), { duration: 250 });
  } else {
    chart.setSize(undefined, minChartHeight, { duration: 250 });
  }
});
</script>

<style lang="scss">
.hide-reset-zoom-button {
  .highcharts-reset-zoom {
    display: none;
  }
}

.hide-tooltips {
  .highcharts-tooltip, .highcharts-tracker, .highcharts-crosshair {
    filter: opacity(0);
    transition: filter 0.2s;
  }
}

.chart-container {
  width: 100%;
  position: relative; /* Required for z-index to work */
  left: -20px;
}

.collapsing {
  transition: height .2s ease;
}

.accordion-button {
  color: var(--cui-black) !important;
  background-color: var(--cui-light) !important;
}

.accordion-item {
  background: rgba(255, 255, 255, 0.5);
}
</style>
