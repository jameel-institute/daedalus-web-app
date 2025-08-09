<template>
  <div>
    <div class="d-flex flex-wrap align-items-center ms-1 mb-3 gap-4">
      <CFormSwitch
        v-model="isDaily"
        label="New per day"
      />
      <div v-if="interventionVariesByScenario" class="d-flex align-items-center gap-2">
        <CFormLabel class="mb-0">
          Show pandemic response interventions:
        </CFormLabel>
        <div class="ms-1">
          <CFormCheck
            v-model="toggledShowBaselineIntervention"
            label="for baseline"
            @update:model-value="handleToggleShowBaselineIntervention"
          />
          <CFormCheck
            v-model="toggledShowAllInterventions"
            label="for all scenarios"
            @update:model-value="handleToggleShowAllInterventions"
          />
        </div>
      </div>
      <CFormSwitch
        v-else
        v-model="toggledShowBaselineIntervention"
        label="Show pandemic response intervention"
      />
      <CFormSwitch
        v-model="enable3d"
        label="3D plots"
        @update:model-value="handleToggle3D"
      />
      <div class="d-flex align-items-stretch gap-2 ms-auto">
        <div
          v-if="showPlotBandsLinesLegend"
          class="bg-white rounded border d-flex align-items-center gap-3 shadow-sm"
        >
          <PlotLinesBandsLegend
            :show-plot-bands="showPlotBandsInLegend"
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
        :enable3d="enable3d"
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
const enable3d = ref(false);
const toggledShowBaselineIntervention = ref(true);
const toggledShowAllInterventions = ref(false);
const previousToggledShowBaselineIntervention = ref(toggledShowBaselineIntervention.value);
const previousToggledShowAllInterventions = ref(toggledShowAllInterventions.value);

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

const showPlotBandsInLegend = computed(() => (toggledShowBaselineIntervention.value || toggledShowAllInterventions.value));
const showPlotBandsLinesLegend = computed(() => (showPlotBandsInLegend.value || !isDaily.value));

const handleToggle3D = (enable3d: boolean) => {
  if (enable3d) {
    // Pandemic response plot bands do not work in 3D mode, so we turn them off
    previousToggledShowAllInterventions.value = toggledShowAllInterventions.value;
    previousToggledShowBaselineIntervention.value = toggledShowBaselineIntervention.value;
    toggledShowAllInterventions.value = false;
    toggledShowBaselineIntervention.value = false;
  } else {
    // Restore previous state when toggling off 3D
    toggledShowAllInterventions.value = previousToggledShowAllInterventions.value;
    toggledShowBaselineIntervention.value = previousToggledShowBaselineIntervention.value;
  }
};

const handleToggleShowBaselineIntervention = (show: boolean) => {
  if (show) {
    enable3d.value = false; // Disable 3D mode when showing any intervention
  } else {
    toggledShowAllInterventions.value = false;
  };
};

const handleToggleShowAllInterventions = (show: boolean) => {
  if (show) {
    enable3d.value = false; // Disable 3D mode when showing any intervention
    toggledShowBaselineIntervention.value = true;
  };
};
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
