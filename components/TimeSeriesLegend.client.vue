<template>
  <ChartLegend
    :items="items"
    :row-height-rem="1"
  />
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape, plotBandsColor, plotLinesColor } from "./utils/charts";

const appStore = useAppStore();

const capacityLabel = computed(() => {
  return appStore.metadata?.results.capacities[0].label; // At first, we expect there to be only one capacity, 'Hospital capacity'
});

const items = computed((): LegendItem[] => {
  const plotBandsItem = { color: plotBandsColor, label: "Pandemic response", shape: LegendShape.Rectangle };
  const plotLinesItem = { color: plotLinesColor, label: capacityLabel.value || "Hospital capacity", shape: LegendShape.Line };
  if (appStore.currentScenario.parameters?.response === "none") {
    return [plotLinesItem]; // No interventions will be displayed on the time series
  } else {
    return [plotBandsItem, plotLinesItem];
  }
});
</script>
