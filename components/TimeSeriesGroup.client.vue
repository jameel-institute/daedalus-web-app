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
          v-model="daily"
          label="New per day"
        />
      </div>
      <CAccordionHeader class="border-top" @click="handleAccordionToggle">
        <span aria-describedby="labelDescriptor">{{ activeSeriesMetadata?.label }}</span>
        <span id="labelDescriptor" class="visually-hidden">{{ activeSeriesMetadata?.description }}</span>
        <TooltipHelp :help-text="activeSeriesMetadata?.description" :classes="['ms-2']" />
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
          :chart-height="chartHeight"
          @mousemove="onMove(seriesId)"
          @touchmove="onMove(seriesId)"
          @touchstart="onMove(seriesId)"
          @mouseleave="handleMouseLeave"
          @mouseover="handleMouseOver"
          @chart-created="chartCreated"
          @chart-destroyed="chartDestroyed"
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
}>();

const emit = defineEmits([
  "hideAllTooltips",
  "showAllTooltips",
  "syncTooltipsAndCrosshairs",
  "toggleOpen",
  "chartCreated",
  "chartDestroyed",
]);

const appStore = useAppStore();

const accordionStyle = {
  "--cui-accordion-btn-focus-box-shadow": "none",
  "--cui-accordion-bg": "rgba(255, 255, 255, 0.7)",
};

// Since we are using a switch we assume there are only two roles.
const timeSeriesGroupRoles = Object.keys(props.seriesGroup.time_series).slice(0, 2); // ["total", "daily"]
const daily = ref(false);
const activeTimeSeriesRole = computed(() => timeSeriesGroupRoles[Number(daily.value)]); // "total"
const activeTimeSeriesId = computed(() => props.seriesGroup.time_series[activeTimeSeriesRole.value]); // "hospitalised"
const activeSeriesMetadata = computed((): DisplayInfo | undefined => {
  return appStore.metadata?.results?.time_series.find(({ id }) => {
    return id === activeTimeSeriesId.value;
  });
});

// Resize the chart when the accordion is opened or closed.
const chartHeight = computed(() => props.open ? props.chartHeightPx : props.minChartHeightPx);

const chartCreated = (seriesId: string, chart: Highcharts.Chart) => {
  emit("chartCreated", seriesId, chart);
};
const chartDestroyed = (seriesId: string) => {
  emit("chartDestroyed", seriesId);
};

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

const handleAccordionToggle = () => {
  emit("toggleOpen");
};

const onMove = (seriesId: string) => {
  emit("syncTooltipsAndCrosshairs", seriesId);
};

const handleMouseLeave = () => {
  emit("hideAllTooltips");
};

const handleMouseOver = () => {
  emit("showAllTooltips");
};
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
    // margin-right: 0.5rem;
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
