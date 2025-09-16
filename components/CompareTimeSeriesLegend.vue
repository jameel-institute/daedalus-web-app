<template>
  <div class="bg-white rounded border d-flex align-items-center gap-3 px-2 py-1 shadow-sm">
    <p class="m-0 small">
      Scenarios by {{ appStore.axisMetadata?.label.toLocaleLowerCase() }}:
    </p>
    <ChartLegend
      v-for="itemColumn in itemsInColumns"
      :key="itemColumn[0].label"
      :items="itemColumn"
      :row-height-rem="1"
      class="p-0 flex-wrap column-gap-3 row-gap-1"
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

// Lay out items in columns manually since the implementation of 'flex-direction: column'
// while applying flex wrap differs between Safari/Firefox/Chrome.
const itemsInColumns = computed(() => {
  const columns = [];
  const itemsPerColumn = 2;
  for (let i = 0; i < items.value.length; i += itemsPerColumn) {
    columns.push(items.value.slice(i, i + itemsPerColumn));
  }
  return columns;
});
</script>

<style scoped lang="scss">
:deep(.legend-container) {
  max-height: 2.3rem;
  margin: 0 !important;
}
</style>
