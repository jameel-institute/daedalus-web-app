<template>
  <div class="card">
    <div class="card-header border-bottom-0 d-flex justify-content-between">
      <div class="d-flex align-items-center">
        <CIcon icon="cilChartLine" size="xl" class="mb-1 text-secondary" />
        <h2 class="fs-5 m-0 ms-3 chart-header">
          Time series
        </h2>
        <CDropdown v-if="variant === 'outside-time-series-card'" class="ps-3">
          <CDropdownToggle @click="showSwitches = !showSwitches">
            <CIcon icon="cilSettings" />
          </CDropdownToggle>
        </CDropdown>
        <span v-if="diffingAgainstBaseline" class="text-secondary ps-2">
          Showing values relative to baseline scenario
        </span>
      </div>
      <div class="d-flex">
        <div v-if="showSwitches" :class="`switch-container ${variant} position-absolute d-flex gap-4`">
          <CFormSwitch
            id="dailySwitch"
            v-model="isDaily"
            label="Display new per day"
          />
          <CFormSwitch
            id="interventionSwitch"
            v-model="showInterventions"
            label="Show interventions"
          />
          <CFormSwitch
            v-if="!diffingAgainstBaseline"
            id="capacitySwitch"
            v-model="showCapacities"
            label="Show capacities"
          />
          <!-- <div class="d-flex gap-2" @click="isGridView = !isGridView">
            <div class="griddy-icons d-flex flex-column position-relative gap-1">
              <div :class="`cursor-pointer ${isGridView ? `text-secondary` : `text-primary`}`">
                <CIcon icon="cilViewStream" size="sm" />
              </div>
              <div :class="`cursor-pointer ${isGridView ? `text-primary` : `text-secondary`}`">
                <CIconSvg size="sm">
                  <svg width="800px" height="800px" viewBox="0 -0.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <title>grid [#1524]</title>
                    <desc>Created with Sketch.</desc>
                    <defs />
                    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                      <g id="Dribbble-Light-Preview" transform="translate(-299.000000, -200.000000)">
                        <g id="icons" transform="translate(56.000000, 160.000000)" :fill="`${isGridView ? `rgb(0, 0, 205)` : `grey`}`">
                          <path d="M254.55,49 L261.9,49 L261.9,42 L254.55,42 L254.55,49 Z M254.55,58 L261.9,58 L261.9,51 L254.55,51 L254.55,58 Z M245.1,49 L252.45,49 L252.45,42 L245.1,42 L245.1,49 Z M245.1,58 L252.45,58 L252.45,51 L245.1,51 L245.1,58 Z M243,60 L264,60 L264,40 L243,40 L243,60 Z" id="grid-[#1524]" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </CIconSvg>
              </div>
            </div>
            <span class="text-muted fs-6 ps-1">Toggle view</span>
          </div> -->
          <div class="d-flex gap-2" @click="isGridView = !isGridView">
            <div class="d-flex position-relative gap-2">
              <div v-if="!isGridView" class="cursor-pointer text-secondary">
                <CIcon icon="cilViewStream" style="width: 1.1rem; height: 1.2rem;" />
              </div>
              <div v-else class="cursor-pointer">
                <!-- <CIcon icon="cilGrid" /> -->
                <CIconSvg>
                  <svg width="800px" height="800px" viewBox="0 -0.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <title>grid [#1524]</title>
                    <desc>Created with Sketch.</desc>
                    <defs />
                    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                      <g id="Dribbble-Light-Preview" transform="translate(-299.000000, -200.000000)">
                        <g id="icons" transform="translate(56.000000, 160.000000)" fill="grey">
                          <path d="M254.55,49 L261.9,49 L261.9,42 L254.55,42 L254.55,49 Z M254.55,58 L261.9,58 L261.9,51 L254.55,51 L254.55,58 Z M245.1,49 L252.45,49 L252.45,42 L245.1,42 L245.1,49 Z M245.1,58 L252.45,58 L252.45,51 L245.1,51 L245.1,58 Z M243,60 L264,60 L264,40 L243,40 L243,60 Z" id="grid-[#1524]" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </CIconSvg>
              </div>
            </div>
            <span class="text-muted fs-6">Toggle viewing mode</span>
          </div>
        </div>
        <!-- <div >
          <CButton
            variant="secondary"
          >
            <CIcon icon="cilSettings" class="text-secondary" />
            <span class="small ps-1">Time series settings</span>
          </CButton>
        </div> -->
        <TimeSeriesLegend :all-lines-colored="allLinesColored" :diffing-against-baseline="diffingAgainstBaseline" />
      </div>
    </div>
    <div class="card-body pb-0 pe-0">
      <div class="d-flex flex-wrap">
        <TimeSeriesGroup
          v-for="(seriesGroup, index) in [appStore.timeSeriesGroups[0], appStore.timeSeriesGroups[1]]"
          :key="seriesGroup.id"
          :grid-view="isGridView"
          :series-group="seriesGroup"
          :group-index="index"
          :open="openedAccordions.includes(seriesGroup.id)"
          :hide-tooltips="hideTooltips"
          :chart-height-px="chartHeightPx"
          :min-chart-height-px="minChartHeightPx"
          :show-interventions="showInterventions"
          :show-capacities="showCapacities"
          :all-lines-colored="allLinesColored"
          :diffing-against-baseline="diffingAgainstBaseline"
          @hide-all-tooltips="hideAllTooltips"
          @show-all-tooltips="hideTooltips = false"
          @chart-created="chartCreated"
          @chart-destroyed="chartDestroyed"
          @sync-tooltips-and-crosshairs="syncTooltipsAndCrosshairs"
          @toggle-open="toggleOpen(seriesGroup.id)"
        />
        <TimeSeriesGroup
          v-for="(seriesGroup, index) in [appStore.timeSeriesGroups[2], appStore.timeSeriesGroups[3]]"
          :key="seriesGroup.id"
          :grid-view="isGridView"
          :series-group="seriesGroup"
          :group-index="index"
          :open="openedAccordions.includes(seriesGroup.id)"
          :hide-tooltips="hideTooltips"
          :chart-height-px="chartHeightPx"
          :min-chart-height-px="minChartHeightPx"
          :show-interventions="showInterventions"
          :show-capacities="showCapacities"
          :all-lines-colored="allLinesColored"
          :diffing-against-baseline="diffingAgainstBaseline"
          @hide-all-tooltips="hideAllTooltips"
          @show-all-tooltips="hideTooltips = false"
          @chart-created="chartCreated"
          @chart-destroyed="chartDestroyed"
          @sync-tooltips-and-crosshairs="syncTooltipsAndCrosshairs"
          @toggle-open="toggleOpen(seriesGroup.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CIcon, CIconSvg } from "@coreui/icons-vue";
import throttle from "lodash.throttle";

const appStore = useAppStore();

const charts = ref<Record<string, Highcharts.Chart>>({});
const hideTooltips = ref(false);
const { openedAccordions, chartHeightPx, minChartHeightPx } = useTimeSeriesAccordionHeights();

const isDaily = ref(false);
const isGridView = ref(true);
const showInterventions = ref(true);
const showCapacities = ref(true);
const variant = "outside-time-series-card";

const showSwitches = ref(variant !== "outside-time-series-card");
const diffingAgainstBaseline = ref(true);
const allLinesColored = ref(false || diffingAgainstBaseline);

const chartCreated = (seriesId: string, chart: Highcharts.Chart) => {
  charts.value = {
    ...charts.value,
    [seriesId]: chart,
  };
};

const chartDestroyed = (seriesId: string) => {
  const newCharts = { ...charts.value };
  delete newCharts[seriesId];
  charts.value = newCharts;
};

/**
 * Synchronize tooltips and crosshairs between charts.
 * Demo: https://www.highcharts.com/demo/highcharts/synchronized-charts
 */
const syncTooltipsAndCrosshairs = throttle((seriesId) => {
  const triggeringChart = charts.value[seriesId];
  if (triggeringChart?.hoverPoint) {
    Object.values(charts.value).forEach((chart) => {
      if (!chart.series) {
        return;
      }
      // Get the point with the same x as the hovered point
      const point = chart.series[0].getValidPoints().find(({ x }) => x === triggeringChart.hoverPoint!.x);

      if (point && point !== triggeringChart.hoverPoint) {
        point.onMouseOver();
      }
    });
  };
}, 100, { leading: true });

const initializeAccordions = () => {
  openedAccordions.value = appStore.timeSeriesGroups?.map(({ id }) => id) || [];
};

const hideAllTooltips = () => {
  setTimeout(() => {
    hideTooltips.value = true;
  }, 500);
};

const toggleOpen = (seriesGroupId: string) => {
  hideAllTooltips();
  if (openedAccordions.value.includes(seriesGroupId)) {
    openedAccordions.value = openedAccordions.value.filter(id => id !== seriesGroupId);
  } else {
    openedAccordions.value = [...openedAccordions.value, seriesGroupId];
  }
};

onMounted(() => {
  initializeAccordions();
});

watch(() => (Object.keys(appStore.timeSeriesData || {})), () => {
  initializeAccordions();
});
</script>

<style scoped lang="scss">
.switch-container {
  z-index: 5; // Must be in front of button or clicks will close the accordion
  right: 15rem;
  top: 1.2rem;
}

.switch-container.outside-time-series-card {
  top: 3.3rem;
  left: 7.5rem;
  background-color: white;
  padding: 1rem;
  padding-right: 1.5rem;
  padding-bottom: 0.5rem;
  border-radius: var(--cui-border-radius);
  border: var(--cui-card-border-width) solid var(--cui-card-border-color);
  width: fit-content;
}

.form-switch label {
  margin-bottom: 0;
  // margin-right: 0.5rem;
  font-size: smaller;
}

.griddy-icons {
  top: -0.6rem;

  div {
    height: 1rem;
  }
}

.dropdown-toggle {
  border: none !important;
}

.dropdown-toggle.show {
  // border: var(--cui-border-width) var(--cui-border-style) var(--cui-border-color) !important;
  // border-bottom: none !important;
  // border-bottom-right-radius: 0 !important;
  // border-bottom-left-radius: 0 !important;
  background-color: $cui-tertiary-bg;
}
</style>
