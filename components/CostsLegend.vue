<template>
  <ChartLegend
    :items="items"
    :row-height-rem="0.7"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { costsPieColors, type LegendItem, LegendShape } from "./utils/charts";

const appStore = useAppStore();

const costLabel = (cost: ScenarioCost) => {
  return appStore.metadata?.results.costs.find(costMeta => costMeta.id === cost.id)?.label;
};

const items = computed((): LegendItem[] => {
  const costsWithColors = appStore.totalCost?.children?.map((cost: ScenarioCost, index: number) => {
    return { color: costsPieColors[index + 1], label: costLabel(cost), shape: LegendShape.Rectangle, value: cost.value };
  });

  const sortedCosts = [...(costsWithColors || [])].sort((a, b) => b.value - a.value);

  // Drop value property
  return sortedCosts.map((cost) => {
    return { color: cost.color, label: cost.label || "", shape: cost.shape };
  });
});
</script>
