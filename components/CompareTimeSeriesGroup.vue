<template>
  <div class="card shadow-sm">
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
      <LazyCompareTimeSeries
        v-if="activeSeriesMetadata"
        hydrate-on-idle
        :group-index="props.groupIndex"
        :hide-tooltips="props.hideTooltips"
        :show-capacities="toggledShowCapacities && allowShowCapacities"
        :synch-point="props.synchPoint"
        :enable3d="props.enable3d"
        :time-series-metadata="activeSeriesMetadata"
        @update-hover-point="(hoverPoint) => $emit('updateHoverPoint', hoverPoint)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TimeSeriesGroup } from "~/types/apiResponseTypes";
import useTimeSeriesGroups from "~/composables/useTimeSeriesGroups";

const props = defineProps<{
  groupIndex: number
  hideTooltips: boolean
  isDaily: boolean
  seriesGroup: TimeSeriesGroup
  synchPoint: Highcharts.Point | undefined
  enable3d: boolean
}>();

defineEmits<{
  hideAllTooltips: []
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const toggledShowCapacities = ref(false);

const appStore = useAppStore();
const { activeSeriesMetadata } = useTimeSeriesGroups(() => props.seriesGroup, () => props.isDaily);

const capacities = computed(() => appStore.metadata?.results.capacities);
const hospitalCapacityId = "hospital_capacity";
const capacityLabel = computed(() => capacities.value?.find(c => c.id === hospitalCapacityId)?.label.toLocaleLowerCase());
// https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-118/
const allowShowCapacities = computed(() => activeSeriesMetadata.value?.id === "hospitalised");
const capacityVariesByScenario = computed(() => {
  const scenarioValues = appStore.currentComparison.scenarios.map((scenario) => {
    return scenario.result.data?.capacities?.find(c => c.id === hospitalCapacityId)?.value;
  });
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
