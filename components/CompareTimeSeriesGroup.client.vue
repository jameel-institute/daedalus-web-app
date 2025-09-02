<template>
  <div class="card shadow-sm">
    <div class="card-header d-flex align-items-center">
      <TimeSeriesHeader :series-metadata="activeSeriesMetadata" />
      <div v-if="allowShowCapacities" class="ms-auto">
        <CFormSwitch
          :id="`${seriesGroup.id}ShowCapacitiesSwitch`"
          v-model="toggledShowCapacities"
          :label="`Show ${capacityLabel}`"
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
        :time-series-metadata="activeSeriesMetadata"
        @update-hover-point="(hoverPoint: Highcharts.Point) => $emit('updateHoverPoint', hoverPoint)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TimeSeriesGroup } from "~/types/apiResponseTypes";
import useTimeSeriesGroup from "~/composables/useTimeSeriesGroup";
import { showCapacities } from "./utils/timeSeriesData";

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
const { activeSeriesMetadata } = useTimeSeriesGroup(() => props.seriesGroup, () => props.isDaily);

const capacityLabel = computed(() => {
  return appStore.metadata?.results.capacities?.map(c => c.label.toLocaleLowerCase()).join(", ");
});
const allowShowCapacities = computed(() => {
  return showCapacities(activeSeriesMetadata.value?.id);
});
</script>

<style lang="scss" scoped>
:deep(.form-check) {
  margin-bottom: 0;
}
</style>
