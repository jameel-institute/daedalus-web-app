<template>
  <div>
    <div class="d-flex flex-wrap align-items-center ms-1 mb-3 gap-4">
      <CFormSwitch
        v-model="isDaily"
        label="New per day"
      />
      <div v-if="interventionVariesByScenario" class="d-flex align-items-center gap-2">
        <CFormLabel class="mb-0">
          Show pandemic responses:
        </CFormLabel>
        <div class="ms-1">
          <CFormCheck
            v-model="toggledShowBaselineIntervention"
            label="for baseline"
            @update:model-value="toggledShowAllInterventions = toggledShowBaselineIntervention && toggledShowAllInterventions"
          />
          <CFormCheck
            v-model="toggledShowAllInterventions"
            label="for all scenarios"
            @update:model-value="toggledShowBaselineIntervention = toggledShowAllInterventions || toggledShowBaselineIntervention"
          />
        </div>
      </div>
      <CFormSwitch
        v-else
        v-model="toggledShowBaselineIntervention"
        label="Show pandemic response"
      />
      <CFormSwitch
        v-model="threeD"
        label="3D plots"
      />
      <div class="d-flex align-items-stretch gap-2 ms-auto">
        <div class="bg-white rounded border d-flex align-items-center gap-3 shadow-sm">
          <PlotLinesBandsLegend
            :show-plot-bands="toggledShowBaselineIntervention || toggledShowAllInterventions"
            :show-plot-lines="!isDaily"
          />
        </div>
        <CompareTimeSeriesLegend />
      </div>
    </div>
    <div class="time-series-container">
      <CompareTimeSeriesGroup
        v-for="(seriesGroup, index) in appStore.timeSeriesGroups"
        :key="seriesGroup.id"
        :series-group="seriesGroup"
        :group-index="index"
        :hide-tooltips="hideTooltips"
        :is-daily="isDaily"
        :synch-point="hoverPoint"
        :three-d="threeD"
        :toggled-show-baseline-intervention="toggledShowBaselineIntervention"
        :toggled-show-all-interventions="toggledShowAllInterventions"
        @hide-all-tooltips="hideAllTooltipsAndCrosshairs"
        @update-hover-point="updateHoverPoint"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import useSynchroniseCharts from "~/composables/useChartSynchroniser";

const appStore = useAppStore();

const isDaily = ref(false);
const threeD = ref(false);
const toggledShowBaselineIntervention = ref(true);
const toggledShowAllInterventions = ref(false);

const {
  hoverPoint,
  hideTooltips,
  updateHoverPoint,
  hideAllTooltipsAndCrosshairs,
} = useSynchroniseCharts();

const responseInterventionId = "response";

const interventionVariesByScenario = computed(() => {
  const scenarioInterventions = appStore.currentComparison.scenarios.map((scenario) => {
    return scenario.result.data?.interventions?.find(c => c.id === responseInterventionId);
  });
  return !scenarioInterventions.every((intervention) => {
    return intervention?.start === scenarioInterventions?.[0]?.start
      && intervention?.end === scenarioInterventions?.[0]?.end;
  });
});
</script>

<style lang="scss" scoped>
.time-series-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .card {
    flex: 1;
    min-width: max(49%, 500px);
  }
}

:deep(.form-check-label) {
  margin-bottom: 0;
}
</style>
