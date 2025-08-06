<template>
  <div class="card">
    <div class="card-header d-flex align-items-center">
      <span aria-describedby="labelDescriptor">{{ activeSeriesMetadata?.label }}</span>
      <span id="labelDescriptor" class="visually-hidden">{{ activeSeriesMetadata?.description }}</span>
      <TooltipHelp :help-text="activeSeriesMetadata?.description" :classes="['ms-2', 'mb-1', 'smaller-icon']" />
    </div>
    <div
      class="card-body py-1 px-0"
      @mouseleave="$emit('hideAllTooltips')"
    >
      <CompareTimeSeries
        v-if="activeSeriesMetadata"
        :group-index="props.groupIndex"
        :hide-tooltips="props.hideTooltips"
        :synch-point="props.synchPoint"
        :time-series-metadata="activeSeriesMetadata"
        :y-units="yUnits"
        @update-hover-point="(hoverPoint) => $emit('updateHoverPoint', hoverPoint)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DisplayInfo, TimeSeriesGroup } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesGroup: TimeSeriesGroup
  groupIndex: number
  hideTooltips: boolean
  isDaily: boolean
  synchPoint: Highcharts.Point | null
}>();

defineEmits<{
  hideAllTooltips: []
  updateHoverPoint: [hoverPoint: Highcharts.Point]
}>();

const appStore = useAppStore();

const activeTimeSeriesRole = computed(() => {
  // Since we are using a switch we assume there are only two roles, and "total" role precedes "daily" role
  const timeSeriesGroupRoles = Object.keys(props.seriesGroup.time_series).slice(0, 2); // ["total", "daily"]
  return timeSeriesGroupRoles[Number(props.isDaily)];
});
const activeTimeSeriesId = computed(() => props.seriesGroup.time_series[activeTimeSeriesRole.value]);
const activeSeriesMetadata = computed((): DisplayInfo | undefined => appStore.allTimeSeriesMetadata?.find(({ id }) => id === activeTimeSeriesId.value));

const yUnits = computed(() => { // TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
  switch (props.seriesGroup.id) {
    case "hospitalisations":
      return "in need of hospitalisation";
    case "deaths":
      return "deaths";
    case "vaccinations":
      return "vaccinated";
    default:
      return "cases";
  }
});
</script>

<style lang="scss" scoped>
</style>
