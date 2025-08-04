<template>
  <div class="card">
    <div class="card-header border-bottom-0 d-flex justify-content-between">
      <div class="d-flex align-items-center">
        <CIcon icon="cilChartLine" size="xl" class="mb-1 text-muted" />
        <h2 class="fs-5 m-0 ms-3 chart-header">
          Time series
        </h2>
      </div>
      <TimeSeriesLegend />
    </div>
    <div class="card-body p-0">
      <TimeSeriesGroup
        v-for="(seriesGroup, index) in appStore.timeSeriesGroups"
        :key="seriesGroup.id"
        :series-group="seriesGroup"
        :group-index="index"
        :open="openedAccordions.includes(seriesGroup.id)"
        :chart-height-px="chartHeightPx"
        :min-chart-height-px="minChartHeightPx"
        :synch-group-id="synchGroupId"
        :hide-tooltips="hideTooltips"
        :synch-point="hoverPoint"
        @hide-all-tooltips="hideAllTooltipsAndCrosshairs"
        @update-hover-point="updateHoverPoint"
        @toggle-open="toggleOpen(seriesGroup.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import Highcharts from "highcharts/esm/highcharts";
import { useUniqueId } from "@coreui/vue";

const appStore = useAppStore();
const { openedAccordions, chartHeightPx, minChartHeightPx } = useTimeSeriesAccordionHeights();

// All charts that synchronize with one another share the same synchGroupId.
// A different group of charts that synchronize together would have a different synchGroupId.
const { getUID } = useUniqueId();
const synchGroupId = getUID();
const hoverPoint = ref<Highcharts.Point | null>(null);
const hideTooltips = ref(false);

const updateHoverPoint = (point: Highcharts.Point) => {
  hideTooltips.value = false;
  hoverPoint.value = point;
};

/**
 * Here, we use Highcharts' 'wrap' utility to make the onContainerMouseLeave method of the Pointer class
 * ignore onContainerMouseLeave events for charts that are synchronized, which appears
 * to be necessary to prevent tooltips and crosshairs from disappearing when the mouse moves *within* a chart,
 * not (as might be expected) when it leaves the chart container.
 * That seems to be a side-effect of syncTooltipsAndCrosshairs calling point.onMouseOver().
 */
Highcharts.wrap(
  Highcharts.Pointer.prototype,
  "onContainerMouseLeave",
  function (this: Highcharts.Pointer, proceed, ...args) {
    const chartIsGroupMember = this.chart.series[0].options.custom?.synchronizationGroupId === synchGroupId;
    if (chartIsGroupMember) {
      proceed.apply(this, args);
    }
  },
);

const hideAllTooltipsAndCrosshairs = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};

const toggleOpen = (seriesGroupId: string) => {
  hideTooltips.value = true;
  if (openedAccordions.value.includes(seriesGroupId)) {
    openedAccordions.value = openedAccordions.value.filter(id => id !== seriesGroupId);
  } else {
    openedAccordions.value = [...openedAccordions.value, seriesGroupId];
  }
};

const initializeAccordions = () => {
  openedAccordions.value = appStore.timeSeriesGroups?.map(({ id }) => id) || [];
};

onMounted(() => {
  initializeAccordions();
});

watch(() => (Object.keys(appStore.timeSeriesData || {})), () => {
  initializeAccordions();
});
</script>

<style scoped lang="scss">
</style>
