<template>
  <div class="bg-white rounded border d-flex align-items-center gap-3 px-2 py-1 shadow-sm">
    <p class="m-0">
      {{ appStore.axisMetadata?.label }}:
    </p>
    <ChartLegend
      :items="items"
      :row-height-rem="0.9"
      class="m-0 p-0 d-flex flex-direction-column flex-wrap column-gap-3 row-gap-1"
      style="height: 2.1rem"
    />
  </div>
</template>

<script setup lang="ts">
import type { Scenario } from "~/types/storeTypes";
import { type LegendItem, LegendShape, multiScenarioTimeSeriesColors } from "./utils/highCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] => {
  const all = appStore.currentComparison.scenarios.map((scenario: Scenario, index: number) => {
    const isBaseline = scenario === appStore.baselineScenario;
    return {
      color: multiScenarioTimeSeriesColors[index].rgb,
      label: `${appStore.getScenarioAxisLabel(scenario)} ${(isBaseline ? " (baseline)" : "")}`,
      shape: LegendShape.Circle,
    };
  }) || [];

  return all;
});
</script>
