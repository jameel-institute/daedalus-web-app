<template>
  <ChartLegend
    :items="items"
    :row-height-rem="0.7"
    class="costs-legend"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { colorBlindSafeColors, type LegendItem, LegendShape } from "./utils/highCharts";

const appStore = useAppStore();

const colors = colorBlindSafeColors.map(color => color.hex);

const costLabel = (cost: ScenarioCost) => {
  return appStore.metadata?.results.costs.find((costMeta: { id: any }) => costMeta.id === cost.id)?.label;
};

const items = computed((): LegendItem[] => {
  const costsWithColors = appStore.totalCost?.children?.map((cost: ScenarioCost, index: number) => {
    // The first color in costsChartColors is used by the Total cost, is transparent, and not included in the legend.
    return { color: colors[index], label: costLabel(cost), shape: LegendShape.Circle, value: cost.value };
  }) || [];

  const sortedCosts = costsWithColors.sort((a: { value: number }, b: { value: number }) => b.value - a.value);

  // Drop value property
  return sortedCosts.map((cost) => {
    return { color: cost.color, label: cost.label || "", shape: cost.shape };
  });
});
</script>

<style lang="scss">
.legend-container.costs-legend {
  position: absolute;
  right: 2rem;
  border-color: var(--cui-border-color);
  border-width: var(--cui-border-width);
  border-style: var(--cui-border-style);
  border-radius: 0.25rem;
  box-shadow: var(--cui-box-shadow-sm);
  background-color: white;
  padding: 0.5rem !important;
}
</style>
