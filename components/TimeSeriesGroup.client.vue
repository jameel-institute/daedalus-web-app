<template>
  <!-- Per each time series group, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
  <CAccordion
    :style="accordionStyle"
    :class="`time-series rounded col-12 ${appStore.largeScreen && props.gridView ? 'col-xl-6' : ''}`"
    :active-item-key="props.open ? props.seriesGroup.id : undefined"
  >
    <CAccordionItem :item-key="props.seriesGroup.id" class="position-relative rounded">
      <CAccordionHeader class="rounded" @click.prevent="console.log('do nothing')">
        <span aria-describedby="labelDescriptor">{{ activeSeriesMetadata?.label }}</span>
        <span id="labelDescriptor" class="visually-hidden">{{ activeSeriesMetadata?.description }}</span>
        <TooltipHelp :help-text="activeSeriesMetadata?.description" :classes="['ms-2', 'mb-1', 'smaller-icon']" />
      </CAccordionHeader>
      <CAccordionBody>
        <TimeSeries
          v-for="(seriesId, seriesRole, seriesIndex) in seriesGroup.time_series"
          v-show="seriesId === activeTimeSeriesId"
          :key="seriesId"
          :series-role="seriesRole as string"
          :series-id="seriesId"
          :hide-tooltips="props.hideTooltips"
          :series-index="seriesIndex"
          :group-index="props.groupIndex"
          :y-units="yUnits"
          :chart-height="open ? gridAdjustedChartHeightPx : minChartHeightPx"
          :show-interventions="props.showInterventions"
          :show-capacities="props.showCapacities"
          :all-lines-colored="props.allLinesColored"
          :diffing-against-baseline="props.diffingAgainstBaseline"
          @mousemove="onMove(seriesId)"
          @touchmove="onMove(seriesId)"
          @touchstart="onMove(seriesId)"
          @mouseleave="$emit('hideAllTooltips')"
          @mouseover="$emit('showAllTooltips')"
          @chart-created="(seriesId, chart) => $emit('chartCreated', seriesId, chart)"
          @chart-destroyed="(seriesId) => $emit('chartDestroyed', seriesId)"
        />
      </CAccordionBody>
    </CAccordionItem>
  </CAccordion>
</template>

<script lang="ts" setup>
import type { DisplayInfo, TimeSeriesGroup } from "~/types/apiResponseTypes";

const props = defineProps<{
  seriesGroup: TimeSeriesGroup
  groupIndex: number
  open: boolean
  hideTooltips: boolean
  chartHeightPx: number
  minChartHeightPx: number
  showInterventions: boolean
  showCapacities: boolean
  gridView: boolean
  allLinesColored: boolean
  diffingAgainstBaseline: boolean
}>();

const emit = defineEmits<{
  hideAllTooltips: []
  showAllTooltips: []
  syncTooltipsAndCrosshairs: [seriesId: string]
  toggleOpen: []
  chartCreated: [seriesId: string, chart: Highcharts.Chart]
  chartDestroyed: [seriesId: string]
}>();

const gridAdjustedChartHeightPx = computed(() => props.gridView ? props.chartHeightPx * 2 : props.chartHeightPx);

const appStore = useAppStore();

const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
  // "min-width": "49%",
  "padding-bottom": "1rem",
  "padding-right": "1rem",
};

// Since we are using a switch we assume there are only two roles, and "total" role precedes "daily" role
const timeSeriesGroupRoles = Object.keys(props.seriesGroup.time_series).slice(0, 2); // ["total", "daily"]
const isDaily = ref(false);
const activeTimeSeriesId = computed(() => {
  const activeTimeSeriesRole = timeSeriesGroupRoles[Number(isDaily.value)]; // total or daily
  return props.seriesGroup.time_series[activeTimeSeriesRole];
});
const activeSeriesMetadata = computed((): DisplayInfo | undefined =>
  appStore.metadata?.results?.time_series.find(({ id }) =>
    id === activeTimeSeriesId.value,
  ),
);

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

const onMove = (seriesId: string) => {
  emit("syncTooltipsAndCrosshairs", seriesId);
};
</script>

<style lang="scss">
.accordion.time-series {
  .collapsing {
    transition: height .2s ease;
  }

  .accordion-body { // These are the default values from CoreUI, but we need to pin them so that our const accordionBodyYPadding is correct.
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  .accordion-button {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
    color: var(--cui-black) !important;
    background-color: var(--cui-light) !important;
    border-top-left-radius: var(--cui-border-radius) !important;
    border-top-right-radius: var(--cui-border-radius) !important;
  }

  .accordion-item {
    background: $light-background;
  }
}
</style>
