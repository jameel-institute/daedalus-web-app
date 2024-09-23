<template>
  <div>
    <div class="d-flex">
      <h4>
        {{ seriesMetadata?.label }}
      </h4>
      <CTooltip
        v-if="seriesMetadata?.description"
        :content="seriesMetadata?.description || undefined"
        placement="top"
      >
        <template #toggler="{ togglerId, on }">
          <CIcon
            icon="cilInfo"
            class="icon help ms-2 mt-1 me-3"
            :aria-describedby="togglerId"
            v-on="on"
          />
        </template>
      </CTooltip>
      <!-- <CTooltip
        content="When switched on, the total values will be displayed. When switched off, the daily rates will be displayed."
        placement="top"
      >
        <template #toggler="{ togglerId, on }">
          <span :aria-describedby="togglerId" class="ms-auto" v-on="on">
            <CFormSwitch
              :id="`formSwitchCheckDefaultFor${props.id}`"
              label="Display total values (currently this does nothing)"
              class="ms-2"
              :reverse="true"
              :checked="true"
            />
          </span>
        </template>
      </CTooltip> -->
      <!-- <CButtonGroup
        role="group"
        aria-label="Show data by prevalence or by incidence"
        size="sm"
        style="height: fit-content;"
      >
        <CFormCheck
          :id="`prevalenceFor${props.id}`"
          v-model="prevalenceOrIncidence"
          :name="`prevalenceFor${props.id}`"
          :value="`prevalenceFor${props.id}`"
          label="Prevalence"
          type="radio"
          :button="{ color: 'primary', variant: 'outline' }"
          autocomplete="off"
          :checked="prevalenceOrIncidence === `prevalenceFor${props.id}`"
        />
        <CFormCheck
          id="incidence"
          v-model="prevalenceOrIncidence"
          type="radio"
          :button="{ color: 'primary', variant: 'outline' }"
          name="incidence"
          autocomplete="off"
          label="Incidence"
          value="incidence"
          :checked="prevalenceOrIncidence === 'incidence'"
        />
      </CButtonGroup> -->
    </div>
    <div
      :id="containerId"
      style="width:100%; height:200px"
      @mousemove="onMove"
      @touchmove="onMove"
      @touchstart="onMove"
    />
  </div>
</template>

<script lang="ts" setup>
import throttle from "lodash.throttle";
import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import exportingInitialize from "highcharts/modules/exporting";
import exportDataInitialize from "highcharts/modules/export-data";
import { CIcon } from "@coreui/icons-vue";
import type { DisplayInfo } from "~/types/apiResponseTypes";

const props = defineProps<{
  id: string
  index: number
}>();

accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);

const appStore = useAppStore();

const prevalenceOrIncidence = ref<string>(`prevalenceFor${props.id}`);

const usePlotLines = props.id === "hospitalised"; // https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/

const containerId = computed(() => `${props.id}-container`);
const data = computed(() => appStore.timeSeriesData![props.id]);
const seriesMetadata = computed((): DisplayInfo | undefined => appStore.metadata?.results?.time_series.find(({ id }) => id === props.id));
const minRange = computed(() => {
  if (usePlotLines) {
    // Get the highest capacity value
    console.log(appStore.capacitiesData?.reduce((acc, { value }) => Math.max(acc, value), 0));
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
      color: "#FF0000", // red
      label: {
        text: `${capacityLabel}: ${value}`,
        style: {
          color: "#FF0000",
        },
      },
      width: 2,
      value,
    });
  });

  return lines;
});

// let plotbands = [{
//                     from: 10,
//                     to: 50,
//                     color: 'rgba(200, 170, 213, .5)'
//                 },
//                 {
//                     from: 204,
//                     to: 258,
//                     color: 'rgba(200, 170, 213, .8)'
//                 },
//                 {
//                     from: 509,
//                     to: 590,
//                     color: 'rgba(200, 170, 213, .3)'
//                 }];

const yUnits = "cases"; // TODO: Make this depend on a 'units' property in metadata.

// TODO: reuse this color in a legend
const plotBandsColor = computed(() => {
  const colorRgba = hexRgb(Highcharts.getOptions().colors[0]);
  colorRgba.alpha = 0.3;
  return `rgba(${Object.values(colorRgba).join(",")})`;
});
const plotBands = computed(() => {
  const bands = Array<Highcharts.AxisPlotBandsOptions>();

  if (props.id === "dead") {
    return bands;
  }

  appStore.interventionsData?.forEach(({ id, start, end }) => {
    const interventionLabel = appStore.metadata?.results.interventions.find(({ id: interventionId }) => interventionId === id)?.label;

    bands.push({
      from: start,
      to: end,
      color: plotBandsColor.value,
      label: {
        text: `${interventionLabel}: Days ${start} to ${end}`,
      },
    });
  });

  return bands;
});

let chart: Highcharts.Chart;

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
    backgroundColor: "transparent",
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
  credits: {
    enabled: false,
  },
  legend: {
    enabled: false,
  },
  tooltip: {
    pointFormat: `<span style='font-weight: 500'>{point.y}</span> ${yUnits}`,
    headerFormat: "<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>",
    valueDecimals: 0,
  },
  xAxis: {
    title: {
      text: "Days since outbreak",
    },
    events: {
      setExtremes: syncExtremes,
    },
    crosshair: true,
    plotBands: plotBands.value,
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
    color: Highcharts.getOptions().colors[props.index + 1], // 0th color is taken by plotBands, so bump the index by one for each time series
    fillOpacity: 0.3,
    tooltip: {
      valueSuffix: ` ${props.id === "vaccination" ? "%" : ""}`, // TODO - use correct id once this time series exists, OR configure in metadata.
    },
  }],
});

onMounted(() => {
  if (!seriesMetadata.value) {
    console.error(`Time series metadata not found for id: ${props.id}`);
  }

  chart = Highcharts.chart(containerId.value, chartInitialOptions());

  // Create the reset zoom button, initially hidden by the className "hide-reset-zoom-button".
  // Using a CSS class to toggle visibility is much more performant than re-using this method.
  chart.showResetZoom();
});
</script>

<style>
.hide-reset-zoom-button {
  .highcharts-reset-zoom {
    display: none;
  }
}
</style>
