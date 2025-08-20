<template>
  <ChartLegend
    :items="items"
    :row-height-rem="1"
  />
</template>

<script setup lang="ts">
import { addAlphaToRgb, type LegendItem, LegendShape, plotBandsDefaultColor, plotBandsRgbAlpha, plotLinesColor } from "./utils/highCharts";

const props = defineProps<{
  showPlotLines: boolean
}>();

const appStore = useAppStore();

const plotLineItems = computed(() => {
  if (!props.showPlotLines) {
    return [];
  }
  return appStore.metadata?.results.capacities.map((capacity) => {
    return { color: plotLinesColor, label: capacity.label, shape: LegendShape.Line };
  }) ?? [];
});

const items = computed((): LegendItem[] => {
  if (appStore.currentScenario.parameters?.response === "none") {
    return plotLineItems.value;
  }

  const plotBandsItem = {
    color: addAlphaToRgb(plotBandsDefaultColor, plotBandsRgbAlpha),
    label: "Pandemic response",
    shape: LegendShape.Rectangle,
  };
  return [plotBandsItem, ...plotLineItems.value];
});
</script>
