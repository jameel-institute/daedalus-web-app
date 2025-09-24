<template>
  <ChartLegend
    :items="items"
    :row-height-rem="1"
  />
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape } from "./utils/charts";
import { addAlphaToRgb, plotBandsDefaultColor, plotBandsRgbAlpha, plotLinesColor, timeSeriesColors } from "./utils/timeSeriesCharts";

const props = defineProps<{
  showPlotLines: boolean
  comparisonMode: boolean
}>();

const appStore = useAppStore();

const plotLineItems = computed(() => {
  if (!props.showPlotLines) {
    return [];
  }
  return appStore.metadata?.results.capacities.map((capacity) => {
    return { color: plotLinesColor, label: capacity.label, shape: LegendShape.SquareDash };
  }) ?? [];
});

let plotBandsColor = plotBandsDefaultColor;
if (props.comparisonMode) {
  plotBandsColor = timeSeriesColors[appStore.baselineIndex % timeSeriesColors.length];
}

const items = computed((): LegendItem[] => {
  if (!props.comparisonMode && appStore.currentScenario.parameters?.response === "none") {
    return plotLineItems.value;
  }

  const plotBandsItem = {
    color: addAlphaToRgb(plotBandsColor, plotBandsRgbAlpha),
    label: "Pandemic response",
    shape: LegendShape.Rectangle,
  };

  return [plotBandsItem, ...plotLineItems.value];
});
</script>
