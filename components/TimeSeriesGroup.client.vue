<template>
  <!-- Per each time series group, use one accordion component with one item, so we can easily initialise them all as open with active-item-key -->
  <CAccordion
    :style="accordionStyle"
    class="time-series"
    :active-item-key="props.open ? props.seriesGroup.id : undefined"
  >
    <CAccordionItem :item-key="props.seriesGroup.id" class="border-0 position-relative">
      <div v-if="props.open" class="switch-container position-absolute">
        <CFormSwitch
          :id="`${props.seriesGroup.id}DailySwitch`"
          v-model="isDaily"
          label="New per day"
        />
      </div>
      <CAccordionHeader class="border-top" @click="$emit('toggleOpen')">
        <span aria-describedby="labelDescriptor">{{ activeSeriesMetadata?.label }}</span>
        <span id="labelDescriptor" class="visually-hidden">{{ activeSeriesMetadata?.description }}</span>
        <TooltipHelp :help-text="activeSeriesMetadata?.description" :classes="['ms-2', 'mb-1', 'smaller-icon']" />
      </CAccordionHeader>
      <CAccordionBody @mouseleave="$emit('hideAllTooltips')">
        <TimeSeries
          v-if="activeSeriesMetadata"
          :chart-height="props.chartHeight"
          :group-index="props.groupIndex"
          :hide-tooltips="props.hideTooltips"
          :series-role="activeTimeSeriesRole"
          :synch-point="props.synchPoint"
          :time-series-metadata="activeSeriesMetadata"
          :y-units="yUnits"
          @update-hover-point="(hoverPoint) => $emit('updateHoverPoint', hoverPoint)"
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
  hideTooltips: boolean
  open: boolean
  chartHeight: number
  synchPoint: Highcharts.Point | null
}>();

defineEmits<{
  hideAllTooltips: []
  updateHoverPoint: [hoverPoint: Highcharts.Point]
  toggleOpen: []
}>();

const appStore = useAppStore();

const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
};

const isDaily = ref(false);
const activeTimeSeriesRole = computed(() => {
  // Since we are using a switch we assume there are only two roles, and "total" role precedes "daily" role
  const timeSeriesGroupRoles = Object.keys(props.seriesGroup.time_series).slice(0, 2); // ["total", "daily"]
  return timeSeriesGroupRoles[Number(isDaily.value)];
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

<style lang="scss">
.accordion.time-series {
  .switch-container {
    z-index: 5; // Must be in front of button or clicks will close the accordion
    right: 4rem;
    top: 0.3rem;
  }

  .form-switch label {
    margin-bottom: 0;
    font-size: smaller;
  }

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
  }

  .accordion-item {
    background: $light-background;
  }
}
</style>
