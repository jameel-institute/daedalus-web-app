<template>
  <div>
    <div class="d-flex flex-wrap align-items-center ms-1 mb-3 gap-4">
      <CFormSwitch
        v-model="isDaily"
        label="Show new events per day"
      />
      <CFormSwitch
        v-model="enable3d"
        label="3D plots"
      />
      <div class="d-flex align-items-stretch gap-2 ms-auto">
        <div
          v-if="showPlotBandsLinesLegend"
          class="bg-white rounded border d-flex align-items-center gap-3 shadow-sm"
        >
          <PlotLinesBandsLegend :show-plot-lines="!isDaily" />
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
        :enable3d="enable3d"
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
const enable3d = ref(false);

const {
  hoverPoint,
  hideTooltips,
  updateHoverPoint,
  hideAllTooltipsAndCrosshairs,
} = useSynchroniseCharts();

const showPlotBandsLinesLegend = computed(() => !isDaily.value);
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
