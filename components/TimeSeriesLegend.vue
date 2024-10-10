<template>
  <ChartLegend
    :items="items"
    :row-height-rem="1"
  />
</template>

<script setup lang="ts">
import { type LegendItem, plotBandsColor, plotLinesColor } from "./utils/charts";

const appStore = useAppStore();

const capacityLabel = computed(() => {
  return appStore.metadata?.results.capacities[0].label; // At first, we expect there to be only one capacity, 'Hospital capacity'
});

const items = computed((): LegendItem[] => {
  return [
    { color: plotBandsColor, label: "Pandemic response", shape: "square" },
    { color: plotLinesColor, label: capacityLabel.value || "Hospital capacity", shape: "line" },
  ];
});
</script>
