<template>
  <ChartLegend
    :items="items"
    :row-height-rem="0.9"
    class="costs-legend m-3 mt-0"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { costsPalette, type LegendItem, LegendShape } from "./utils/highCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] =>
  appStore.currentComparison.scenarios[0].result.data?.costs[0].children?.map((cost: ScenarioCost, index: number) => {
    return {
      color: costsPalette[index].rgb,
      label: appStore.getCostLabel(cost.id),
      shape: LegendShape.Circle,
      value: cost.value,
    };
  }) || [],
);
</script>

<style lang="scss">
.legend-container.costs-legend {
  border-color: var(--cui-border-color);
  border-width: var(--cui-border-width);
  border-style: var(--cui-border-style);
  border-radius: 0.25rem;
  box-shadow: var(--cui-box-shadow-sm);
  background-color: white;
  padding: 0.5rem !important;
  width: fit-content;
}
</style>
