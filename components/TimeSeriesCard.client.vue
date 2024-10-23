<template>
  <div class="card-body p-0">
    <TimeSeriesGroup
      v-for="(seriesGroup, index) in appStore.timeSeriesGroups"
      :key="seriesGroup.id"
      :series-group="seriesGroup"
      :group-index="index"
      :open="openedAccordions.includes(seriesGroup.id)"
      :hide-tooltips="hideTooltips"
      :chart-height-px="chartHeightPx"
      :min-chart-height-px="minChartHeightPx"
      @hide-all-tooltips="hideAllTooltips"
      @show-all-tooltips="showAllTooltips"
      @chart-created="chartCreated"
      @chart-destroyed="chartDestroyed"
      @sync-tooltips-and-crosshairs="syncTooltipsAndCrosshairs"
      @toggle-open="toggleOpen(seriesGroup.id)"
    />
  </div>
</template>

<script setup lang="ts">
import throttle from "lodash.throttle";

const appStore = useAppStore();

const charts = ref<Record<string, Highcharts.Chart>>({});
const openedAccordions = ref<string[]>([]);
const hideTooltips = ref(false);
const accordionBodyYPadding = 8;
const minAccordionHeight = 145;
const maxAccordionHeight = 400;
const minTotalAccordionHeight = 500;
const minChartHeightPx = minAccordionHeight - (2 * accordionBodyYPadding);
const maxTotalAccordionHeight = computed(() => {
  if (appStore.timeSeriesGroups) { // Allow at least minAccordionHeight for each accordion
    return Math.max(minTotalAccordionHeight, (Object.keys(appStore.timeSeriesGroups!).length * minAccordionHeight));
  } else {
    return minTotalAccordionHeight;
  }
});
// Share available height equally between open accordions. Avoid division by zero.
const accordionHeight = computed(() => openedAccordions.value.length ? (maxTotalAccordionHeight.value / openedAccordions.value.length) : 1);
const chartHeightPx = computed(() => Math.min(accordionHeight.value, maxAccordionHeight) - (2 * accordionBodyYPadding));

const chartCreated = (seriesId: string, chart: Highcharts.Chart) => {
  charts.value = {
    ...charts.value,
    [seriesId]: chart,
  };
};

const chartDestroyed = (seriesId: string) => {
  const newCharts = { ...charts.value };
  delete newCharts[seriesId];
  charts.value = newCharts;
};

/**
 * Synchronize tooltips and crosshairs between charts.
 * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
 */
const syncTooltipsAndCrosshairs = throttle((seriesId) => {
  const triggeringChart = charts.value[seriesId];
  if (triggeringChart?.hoverPoint) {
    Object.values(charts.value).forEach((chart) => {
      if (!chart.series) {
        return;
      }
      // Get the point with the same x as the hovered point
      const point = chart.series[0].getValidPoints().find(({ x }) => x === triggeringChart.hoverPoint!.x);

      if (point && point !== triggeringChart.hoverPoint) {
        point.onMouseOver();
      }
    });
  };
}, 100, { leading: true });

const initializeAccordions = () => {
  openedAccordions.value = appStore.timeSeriesGroups?.map(({ id }) => id) || [];
};

const showAllTooltips = () => {
  hideTooltips.value = false;
};

const hideAllTooltips = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};

const toggleOpen = (seriesGroupId: string) => {
  hideAllTooltips();
  if (openedAccordions.value.includes(seriesGroupId)) {
    openedAccordions.value = openedAccordions.value.filter(id => id !== seriesGroupId);
  } else {
    openedAccordions.value = [...openedAccordions.value, seriesGroupId];
  }
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
