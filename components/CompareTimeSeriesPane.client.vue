<template>
  <div>
    <div class="d-flex flex-wrap align-items-center ms-1 mb-3 gap-4">
      <CFormSwitch
        id="dailySwitch"
        v-model="isDaily"
        label="Show new events per day"
      />
      <div class="d-flex align-items-stretch gap-2 ms-auto">
        <div class="bg-white rounded border d-flex align-items-center gap-3 shadow-sm">
          <CapacitiesAndInterventionsLegend
            :show-plot-lines="!isDaily"
            :comparison-mode="true"
          />
        </div>
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
import useSynchroniseCharts from "~/composables/useSynchroniseCharts";

const appStore = useAppStore();

const isDaily = ref(false);

const { hoverPoint, hideTooltips, updateHoverPoint, hideAllTooltipsAndCrosshairs } = useSynchroniseCharts();
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
