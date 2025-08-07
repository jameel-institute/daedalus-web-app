<template>
  <div>
    <div class="d-flex align-items-center ms-1 mb-3">
      <CFormSwitch
        v-model="isDaily"
        label="New per day"
      />
      <div class="ms-auto">
        <CompareTimeSeriesLegend />
      </div>
    </div>
    <div class="time-series-container">
      <CompareTimeSeriesGroup
        v-for="(seriesGroup, index) in appStore.timeSeriesGroups"
        :key="seriesGroup.id"
        :series-group="seriesGroup"
        :group-index="index"
        :hide-tooltips="hideTooltips"
        :is-daily="isDaily"
        :synch-point="hoverPoint"
        @hide-all-tooltips="hideAllTooltipsAndCrosshairs"
        @update-hover-point="updateHoverPoint"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import useSynchroniseCharts from "~/composables/useChartSynchroniser";

const appStore = useAppStore();

const isDaily = ref(false);

const {
  hoverPoint,
  hideTooltips,
  updateHoverPoint,
  hideAllTooltipsAndCrosshairs,
} = useSynchroniseCharts();
</script>

<style lang="scss" scoped>
.time-series-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .card {
    flex: 1;
    min-width: max(49%, 500px);
  }
}

:deep(.form-check-label) {
  margin-bottom: 0;
}
</style>
