<template>
  <Legend
    :items="items"
    :row-height-rem="1"
  />
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape, plotBandsColor, plotLinesColor } from "./utils/highCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] => {
  const plotLineItems = appStore.metadata?.results.capacities.map((capacity) => {
    return { color: plotLinesColor, label: capacity.label, shape: LegendShape.Line };
  }) ?? [];

  if (appStore.currentScenario.parameters?.response === "none") {
    return plotLineItems;
  }

  const plotBandsItem = { color: plotBandsColor, label: "Pandemic response", shape: LegendShape.Rectangle };
  return [plotBandsItem, ...plotLineItems];
});
</script>
