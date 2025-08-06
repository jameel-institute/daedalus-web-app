<template>
  <div class="compare-time-series-legend rounded border d-flex align-items-center gap-3 px-2 py-1">
    <p class="m-0">
      {{ appStore.axisMetadata?.label }}:
    </p>
    <ChartLegend
      :items="items"
      :row-height-rem="1"
      class="m-0 p-0 d-flex flex-direction-column flex-wrap column-gap-3 row-gap-1"
      style="height: 2.3rem"
    />
  </div>
</template>

<script setup lang="ts">
import type { Scenario } from "~/types/storeTypes";
import { colorBlindSafeColors, type LegendItem, LegendShape, nonBaselineOpacity } from "./utils/highCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] => {
  const all = appStore.currentComparison.scenarios.map((scenario: Scenario, index: number) => {
    const isBaseline = scenario === appStore.baselineScenario;
    return {
      color: colorBlindSafeColors[index].rgb,
      label: `${appStore.getScenarioAxisLabel(scenario)} ${(isBaseline ? " (baseline)" : "")}`,
      shape: LegendShape.Circle,
      opacity: scenario === appStore.baselineScenario ? 1 : nonBaselineOpacity,
    };
  }) || [];

  return all;
});
</script>

<style lang="scss">
.compare-time-series-legend {
  background-color: white;
}
</style>
