<template>
  <!-- Per time series, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
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
          class="chart-container"
          :style="{ zIndex, height: `${containerHeightPx}px` }"
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

import { highchartsColors, plotBandsColor, plotLinesColor } from "./utils/charts";
import type { DisplayInfo } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesId: string
  index: number
  openAccordions: string[]
}>();

const emit = defineEmits(["toggleOpen"]);
accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);

const appStore = useAppStore();

let chart: Highcharts.Chart;
const accordionBodyYPadding = 8;
const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
};
const usePlotLines = props.seriesId === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
// We need each chart to have a higher z-index than the next one so that the exporting context menu is always on top and clickable.
// Also, they should be at least 3 so that they are above .accordion-button:focus
const zIndex = (Object.keys(appStore.timeSeriesData!).length - props.index) + 3;
const yUnits = props.seriesId === "dead" ? "deaths" : "cases"; // TODO: Make this depend on a 'units' property in metadata.
const accordionMinHeight = 150;
// Allow at least accordionMinHeight for each accordion
const maxHeightForAllAccordions = Math.max(500, (Object.keys(appStore.timeSeriesData!).length * accordionMinHeight));

const isOpen = computed(() => props.openAccordions.includes(props.seriesId));
const containerHeightPx = computed(() => maxHeightForAllAccordions / props.openAccordions.length);
const containerId = computed(() => `${props.seriesId}-container`);
const data = computed(() => {
  return appStore.timeSeriesData![props.seriesId].map((value, index) => [index + 1, value]);
});
const seriesMetadata = computed((): DisplayInfo | undefined => appStore.metadata?.results?.time_series.find(({ id }) => id === props.seriesId));
// On zooming, the y-axis automatically rescales to the data (ignoring the plotLines). We want the plotLines
// to remain visible, so we limit the y-axis' minimum range.
const minRange = computed(() => {
  if (usePlotLines) {
    return appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0);
  } else {
    return undefined;
  }
});
const plotLines = computed(() => {
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

const plotBands = computed(() => {
  const bands = Array<Highcharts.AxisPlotBandsOptions>();

  if (props.seriesId === "dead") {
    return bands;
  }

  appStore.interventionsData?.forEach(({ id, start, end }) => {
    const interventionLabel = appStore.metadata?.results.interventions.find(({ id: interventionId }) => interventionId === id)?.label;

    bands.push({
      from: start,
      to: end,
      color: plotBandsColor,
      label: {
        text: `${interventionLabel ? `${interventionLabel} : ` : ""}Days ${start} to ${end}`,
      },
    });
  });

  return bands;
});

const syncTooltipsAndCrosshairs = throttle(() => {
  const pointOnOriginalChart = chart.series[0].getValidPoints().find(({ state }) => state === "hover");

  if (pointOnOriginalChart) {
    Highcharts.each(Highcharts.charts, ({ series }: { series: Highcharts.Series[] }) => {
      // Get the point with the same x as the hovered point
      const point = series[0].getValidPoints().find(({ x }) => x === pointOnOriginalChart.x);

      if (point && point !== pointOnOriginalChart) {
        point.onMouseOver();
      }
    });
  };
}, 25, { leading: true });

const handleAccordionToggle = () => {
  emit("toggleOpen");
};

/**
 * In order to synchronize tooltips and crosshairs, override the
 * built-in events with handlers defined on the parent element.
 */
const onMove = () => syncTooltipsAndCrosshairs();

/**
 * Override the reset function, we don't need to hide the tooltips and
 * crosshairs.
 */
Highcharts.Pointer.prototype.reset = function () {
  return undefined;
};

/**
 * Synchronize zooming through the setExtremes event handler.
 */
const syncExtremes = (event) => {
  if (event.trigger !== "syncExtremes") {
    Highcharts.each(Highcharts.charts, (ch: Highcharts.Chart) => {
      if (ch.xAxis[0].setExtremes) { // setExtremes is null while updating
        ch.xAxis[0].setExtremes(
          event.min,
          event.max,
          undefined,
          { duration: 250 },
          { trigger: "syncExtremes" },
        );
        if (event.min && event.max) {
          // Prevent exporting while zoomed in since image export doesn't work well when zoomed in
          ch.update({ chart: { className: undefined }, exporting: { enabled: false } });
        } else {
          ch.update({ chart: { className: "hide-reset-zoom-button" }, exporting: { enabled: true } });
        }
      }
    });
  }
};

const chartInitialOptions = () => ({
  chart: {
    marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
    backgroundColor: "transparent",
    events: {
      fullscreenOpen() {
        this.update({
          chart: {
            backgroundColor: "white",
          },
        });
      },
      fullscreenClose() {
        this.update({
          chart: {
            backgroundColor: "transparent",
          },
        });
      },
    },
    className: "hide-reset-zoom-button",
    style: {
      fontFamily: "inherit",
    },
    zooming: {
      type: "x",
    },
  },
  exporting: {
    filename: `${seriesMetadata.value!.label} in ${appStore.currentScenario.parameters?.country}`,
    chartOptions: { // Show title and subtitle in exported image, but not in normal rendering
      title: {
        text: seriesMetadata.value!.label,
        style: {
          fontWeight: "500",
        },
      },
      subtitle: {
        text: seriesMetadata.value!.description,
      },
    },
  },
  title: {
    text: "",
  },
  legend: {
    enabled: false,
  },
  tooltip: {
    pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${yUnits}`,
    headerFormat: "<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>",
    valueDecimals: 0,
  },
  xAxis: { // Omit title to save vertical space
    events: {
      setExtremes: syncExtremes,
    },
    crosshair: true,
    plotBands: plotBands.value,
    minTickInterval: 1,
    min: 1,
  },
  yAxis: {
    title: {
      text: "",
    },
    min: 0,
    minRange: minRange.value,
    plotLines: plotLines.value,
  },
  series: [{
    data: data.value,
    name: seriesMetadata.value!.label,
    type: "area", // or "line"
    color: highchartsColors[props.index],
    fillOpacity: 0.3,
    tooltip: {
      valueSuffix: ` ${props.seriesId === "vaccination" ? "%" : ""}`, // TODO - use correct id once this time series exists, OR configure in metadata.
    },
    marker: {
      enabled: false,
    },
  }],
});

onMounted(() => {
  if (!seriesMetadata.value) {
    console.error(`Time series metadata not found for id: ${props.seriesId}`);
  }

  chart = Highcharts.chart(containerId.value, chartInitialOptions());

  // Create the reset zoom button, initially hidden by the className "hide-reset-zoom-button".
  // Using a CSS class to toggle visibility is much more performant than re-using this method.
  chart.showResetZoom();
});

watch(() => props.openAccordions, () => {
  if (isOpen.value) {
    const newHeight = (containerHeightPx.value - (2 * accordionBodyYPadding));
    chart.setSize(undefined, newHeight, { duration: 250 });
  }
});
</script>

<style lang="scss">
.hide-reset-zoom-button {
  .highcharts-reset-zoom {
    display: none;
  }
}

.chart-container {
  width: 100%;
  position: relative; /* Required for z-index to work */
  left: -20px;
}

.accordion-button {
  color: var(--cui-black) !important;
  background-color: var(--cui-light) !important;
}

.accordion-item {
  background: rgba(255, 255, 255, 0.5);
}
</style>
