<template>
  <div class="card">
    <div class="card-header d-flex align-items-center">
      <TimeSeriesHeader :series-metadata="activeSeriesMetadata" />
      <div v-if="allowShowCapacities" class="ms-auto">
        <CFormSwitch
          v-model="toggledShowCapacities"
          :label="switchLabel"
        />
      </div>
    </div>
    <div
      class="card-body py-1 px-0"
      @mouseleave="$emit('hideAllTooltips')"
    >
      <CompareTimeSeries
        v-if="activeSeriesMetadata"
        :group-index="props.groupIndex"
        :hide-tooltips="props.hideTooltips"
        :show-capacities="toggledShowCapacities && allowShowCapacities"
        :synch-point="props.synchPoint"
        :time-series-metadata="activeSeriesMetadata"
        :y-units="timeSeriesYUnits(props.seriesGroup.id)"
        @update-hover-point="(hoverPoint) => $emit('updateHoverPoint', hoverPoint)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TimeSeriesGroup } from "~/types/apiResponseTypes";
import { timeSeriesYUnits } from "./utils/highCharts";
import useTimeSeriesGroups from "~/composables/useTimeSeriesGroups";

const props = defineProps<{
  groupIndex: number
  hideTooltips: boolean
  isDaily: boolean
  seriesGroup: TimeSeriesGroup
  synchPoint: Highcharts.Point | undefined
}>();

defineEmits<{
  hideAllTooltips: []
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const toggledShowCapacities = ref(false);

const appStore = useAppStore();
const { activeSeriesMetadata } = useTimeSeriesGroups(() => props.seriesGroup, () => props.isDaily);

const capacities = computed(() => appStore.metadata?.results.capacities);
// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const capacityLabel = computed(() => capacities.value?.[0].label.toLocaleLowerCase());
const allowShowCapacities = computed(() => activeSeriesMetadata.value?.id === "hospitalised");
const capacityVariesByScenario = computed(() => {
  const capacityId = capacities.value?.[0].id;
  if (!capacityId) {
    return false;
  }
  // E.g. scenarios may vary by the hospital_capacity parameter, and this is one of the capacities we can show.
  const scenarioValues = appStore.currentComparison.scenarios.map(s => s.parameters?.[capacityId]);
  return !scenarioValues.every(v => v === scenarioValues[0]);
});
const switchLabel = computed(() => {
  if (capacityVariesByScenario.value) {
    return `Show ${capacityLabel.value} for baseline`;
  }
  return `Show ${capacityLabel.value}`;
});
</script>

<style lang="scss" scoped>
:deep(.form-check) {
  margin-bottom: 0;
}
</style>
