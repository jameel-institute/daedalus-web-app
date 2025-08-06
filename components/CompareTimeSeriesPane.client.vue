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
    <div class="time-series-container gap-2">
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
const appStore = useAppStore();

const hoverPoint = ref<Highcharts.Point | null>(null);
const hideTooltips = ref(false);
const isDaily = ref(false);

const updateHoverPoint = (point: Highcharts.Point) => {
  hideTooltips.value = false;
  hoverPoint.value = point;
};

const hideAllTooltipsAndCrosshairs = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};
</script>

<style lang="scss" scoped>
.time-series-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

:deep(.form-check-label) {
  margin-bottom: 0;
}
</style>
