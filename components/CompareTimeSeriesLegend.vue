<template>
  <div class="bg-white rounded border d-flex align-items-center gap-3 px-2 py-1 shadow-sm">
    <p class="m-0 small">
      Scenarios by {{ appStore.axisMetadata?.label.toLocaleLowerCase() }}:
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
import { type LegendItem, LegendShape } from "./utils/charts";
import { timeSeriesColors } from "./utils/timeSeriesCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] => {
  const all = appStore.currentComparison.scenarios.map((scenario: Scenario, index: number) => {
    const isBaseline = scenario === appStore.baselineScenario;
    return {
      color: timeSeriesColors[index],
      label: `${appStore.getScenarioAxisLabel(scenario)} ${(isBaseline ? " (baseline)" : "")}`,
      shape: LegendShape.Line,
    };
  }) || [];

  return all;
});
</script>
