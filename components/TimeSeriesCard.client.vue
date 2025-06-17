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
        @hide-all-tooltips="hideAllTooltipsAndCrosshairs"
        @chart-created="chartCreated"
        @chart-destroyed="chartDestroyed"
        @sync-tooltips-and-crosshairs="syncTooltipsAndCrosshairs"
        @toggle-open="toggleOpen(seriesGroup.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon } from "@coreui/icons-vue";
import throttle from "lodash.throttle";
import * as Highcharts from "highcharts";

const appStore = useAppStore();

const chartIndices = ref<Record<string, number>>({});
const { openedAccordions, chartHeightPx, minChartHeightPx } = useTimeSeriesAccordionHeights();

const getChartBySeriesId = (seriesId: string): Highcharts.Chart | undefined => {
  const chartIndex = chartIndices.value[seriesId];
  return Highcharts.charts[chartIndex];
};

const allCharts = computed((): Highcharts.Chart[] => {
  return Object.values(chartIndices.value).map(chartIndex => Highcharts.charts[chartIndex]).filter(chart => !!chart);
});

const chartCreated = (seriesId: string, chartIndex: number) => {
  chartIndices.value = {
    ...chartIndices.value,
    [seriesId]: chartIndex,
  };
};

const chartDestroyed = (seriesId: string) => {
  const newCharts = { ...chartIndices.value };
  delete newCharts[seriesId];
  chartIndices.value = newCharts;
};

/**
 * Synchronize tooltips and crosshairs between charts.
 * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
 */
const syncTooltipsAndCrosshairs = throttle((seriesId) => {
  const triggeringChart = getChartBySeriesId(seriesId);
  const hoverPoint = triggeringChart?.hoverPoint;
  if (hoverPoint) {
    allCharts.value.forEach((chart) => {
      if (!chart?.series) {
        return;
      }
      // Get the point with the same x as the hovered point
      const point = chart.series[0].getValidPoints().find(({ x }) => x === hoverPoint.x);

      if (point && point !== hoverPoint) {
        point.onMouseOver();
      }
    });
  };
}, 100, { leading: true });

/**
 * Here, we use Highcharts' 'wrap' utility to make the onContainerMouseLeave method of the Pointer class
 * ignore onContainerMouseLeave events for charts that are managed by this TimeSeriesCard, which appears
 * to be necessary to prevent tooltips and crosshairs from disappearing when the mouse moves *within* a chart,
 * not (as might be expected) when it leaves the chart container.
 * That seems to be a side-effect of syncTooltipsAndCrosshairs calling point.onMouseOver().
 */
Highcharts.wrap(
  Highcharts.Pointer.prototype,
  "onContainerMouseLeave",
  function (this: Highcharts.Pointer, proceed, ...args) {
    const indices = Object.values(chartIndices.value);
    const index = this.chart.index;
    if (!indices.includes(index)) {
      proceed.apply(this, args);
    }
  },
);

const hideAllTooltipsAndCrosshairs = () => {
  setTimeout(() => {
    allCharts.value.forEach((chart) => {
      chart.pointer.reset(false, 0);
    });
  }, 500);
};

const toggleOpen = (seriesGroupId: string) => {
  hideAllTooltipsAndCrosshairs();
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
