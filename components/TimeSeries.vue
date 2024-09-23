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
        <template #toggler="{ id, on }">
          <CIcon
            icon="cilInfo"
            class="icon help ms-2 mt-1 me-3"
            :aria-describedby="id"
            v-on="on"
          />
        </template>
      </CTooltip>
      <CTooltip
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
      </CTooltip>
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
      style="width:100%; height:400px"
      @mousemove="onMove"
      @touchmove="onMove"
      @touchstart="onMove"
    />
  </div>
</template>

<script lang="ts" setup>
import throttle from "lodash.throttle";
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import exportingInitialize from "highcharts/modules/exporting";
import exportDataInitialize from "highcharts/modules/export-data";
import { CIcon } from "@coreui/icons-vue";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import { InterventionLevel } from "~/types/resultTypes";

const props = defineProps<{
  id: string
  index: number
}>();

accessibilityInitialize(Highcharts);
exportingInitialize(Highcharts);
exportDataInitialize(Highcharts);

const appStore = useAppStore();

const prevalenceOrIncidence = ref<string>(`prevalenceFor${props.id}`);

const containerId = computed(() => `${props.id}-container`);
const data = computed(() => appStore.timeSeriesData![props.id]);
const seriesMetadata = computed((): DisplayInfo | undefined => appStore.metadata?.results?.time_series.find(({ id }) => id === props.id));
const plotLines = computed(() => {
  const lines = Array<Highcharts.AxisPlotLinesOptions>();

  if (props.id !== "hospitalised") { // TODO - configure use of plotlines in metadata.
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

const plotBands = computed(() => {
  const bands = Array<Highcharts.AxisPlotBandsOptions>();

  appStore.interventionsData?.forEach(({ id, level, start, end }) => {
    const interventionLabel = appStore.metadata?.results.interventions.find(({ id: interventionId }) => interventionId === id)?.label;

    bands.push({
      from: start,
      to: end,
      color: (level === InterventionLevel.Heavy) ? "rgba(200, 170, 213, .7)" : "rgba(200, 170, 213, .3)",
      label: {
        text: `${interventionLabel} - ${start} until ${end}`,
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
          ch.showResetZoom();
        } else if (ch.resetZoomButton) {
          ch.resetZoomButton.hide();
        }
      }
    });
  }
};

onMounted(() => {
  if (!seriesMetadata.value) {
    console.error(`Time series metadata not found for id: ${props.id}`);
  }

  chart = Highcharts.chart(containerId.value, {
    chart: {
      backgroundColor: "transparent",
      style: {
        fontFamily: "inherit",
      },
      zooming: {
        type: "x",
      },
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    title: {
      text: seriesMetadata.value!.label,
      style: {
        fontWeight: "500",
      },
    },
    subtitle: {
      text: seriesMetadata.value!.description,
    },
    tooltip: {
      // backgroundColor: "none",
      pointFormat: "<span style='font-weight: 500'>{point.y}</span>",
      headerFormat: "<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day {point.x}</span><br/>",
      // shadow: tru,
      // style: {
      //   fontSize: "18px",
      // },
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
      plotLines: plotLines.value,
    },
    series: [{
      data: data.value,
      name: seriesMetadata.value!.label,
      type: "area", // or "line"
      color: Highcharts.getOptions().colors[props.index],
      fillOpacity: 0.3,
      tooltip: {
        valueSuffix: ` ${props.id === "vaccination" ? "%" : ""}`, // TODO - use correct id once this time series exists, OR configure in metadata.
      },
    }],
  });

  // Get the data. The contents of the data file can be viewed at
  //   Highcharts.ajax({
  //     url: "https://jameel-institute.github.io/daedalus-mockups/samples/data/activity.json",
  //     // url: 'https://www.highcharts.com/samples/data/activity.json', Original data from here (faked)
  //     dataType: "text",
  //     success(activity) {
  //       activity = JSON.parse(activity);
  //       activity.datasets.forEach((dataset, i) => {
  //         // Add X values
  //         dataset.data = Highcharts.map(dataset.data, (val, j) => {
  //           return [(activity.xData[j] * 100), val];
  //         });

  //         let plotlines = [];
  //         let yAxisTitle = null;
  //         let xAxisTitle = null;
  //         let plotbands = [{
  //           from: 10,
  //           to: 50,
  //           color: "rgba(200, 170, 213, .5)",
  //         }, {
  //           from: 204,
  //           to: 258,
  //           color: "rgba(200, 170, 213, .8)",
  //         }, {
  //           from: 509,
  //           to: 590,
  //           color: "rgba(200, 170, 213, .3)",
  //         }];
  //         switch (dataset.name) {
  //           case "Speed":
  //             dataset.name = "Vaccination uptake";
  //             dataset.unit = "%";
  //             yAxisTitle = dataset.unit;
  //             plotbands = [];
  //             break;
  //           case "Elevation":
  //             dataset.name = "Infections";
  //             dataset.unit = "";
  //             dataset.data = dataset.data.map(x => [x[0], x[1] * 1000]);
  //             break;
  //           case "Heart rate":
  //             dataset.name = "Hospital occupancy";
  //             dataset.unit = "";
  //             dataset.data = dataset.data.map(x => [x[0], x[1] * 1000]);
  //             xAxisTitle = "Day";
  //             plotlines = [{
  //               color: "#FF0000",
  //               width: 2,
  //               value: 150000,
  //             }];
  //             break;
  //         }

  //         const chartDiv = document.createElement("div");
  //         chartDiv.className = "chart";
  //         document.getElementById("container1").appendChild(chartDiv);

//         Highcharts.chart(chartDiv, {
//           chart: {
//             marginLeft: 60, // Keep all charts left aligned
//             spacingTop: 20,
//             spacingBottom: 20,
//           },
//           title: {
//             text: dataset.name,
//             align: "left",
//             x: 50,
//           },
//           credits: {
//             enabled: false,
//           },
//           legend: {
//             enabled: false,
//           },
//           xAxis: {
//             title: {
//               text: xAxisTitle,
//             },
//             crosshair: true,
//             events: {
//               setExtremes: syncExtremes,
//             },
//             labels: {
//               format: "{value}",
//             },
//             plotBands: plotbands,
//           },
//           yAxis: {
//             title: {
//               text: yAxisTitle,
//             },
//             plotLines: plotlines,
//           },
//           tooltip: {
//             positioner() {
//               return {
//                 // right aligned
//                 x: (this.chart.chartWidth - this.label.width) - 30,
//                 y: 16,
//               };
//             },
//             borderWidth: 0,
//             backgroundColor: "none",
//             pointFormat: "{point.y}",
//             headerFormat: "",
//             shadow: false,
//             style: {
//               fontSize: "18px",
//             },
//             valueDecimals: dataset.valueDecimals,
//           },
//           series: [{
//             data: dataset.data,
//             name: dataset.name,
//             type: dataset.type,
//             color: Highcharts.getOptions().colors[i],
//             fillOpacity: 0.3,
//             tooltip: {
//               valueSuffix: ` ${dataset.unit}`,
//             },
//           }],
//         });
//       });
//     },
//   });
});
</script>

<style>

</style>
