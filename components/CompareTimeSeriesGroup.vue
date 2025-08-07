<template>
  <div class="card">
    <div class="card-header d-flex align-items-center">
      <TimeSeriesHeader :series-metadata="activeSeriesMetadata" />
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

const { activeSeriesMetadata } = useTimeSeriesGroups(() => props.seriesGroup, () => props.isDaily);
</script>
