<template>
  <div class="card">
    <div class="card-header border-bottom-0 d-flex justify-content-between">
      <div class="d-flex align-items-center">
        <CIcon icon="cilChartLine" size="xl" class="mb-1 text-muted" />
        <h2 class="fs-5 m-0 ms-3">
          Time series
        </h2>
      </div>
      <CapacitiesAndInterventionsLegend :show-plot-lines="true" />
    </div>
    <div class="card-body p-0">
      <TimeSeriesGroup
        v-for="(seriesGroup, index) in appStore.timeSeriesGroups"
        :key="seriesGroup.id"
        :series-group="seriesGroup"
        :group-index="index"
        :open="openedAccordions.includes(seriesGroup.id)"
        :chart-height="openedAccordions.includes(seriesGroup.id) ? chartHeightPx : minChartHeightPx"
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
import useSynchroniseCharts from "~/composables/useSynchroniseCharts";

const appStore = useAppStore();
const { openedAccordions, chartHeightPx, minChartHeightPx } = useTimeSeriesAccordionHeights();

const {
  hoverPoint,
  hideTooltips,
  updateHoverPoint,
  hideAllTooltipsAndCrosshairs,
} = useSynchroniseCharts();

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

watch(() => (Object.keys(appStore.currentScenario.result || {})), () => {
  initializeAccordions();
});
</script>
