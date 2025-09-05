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

const items = computed((): LegendItem[] => {
  if (appStore.currentScenario.parameters?.response === "none") {
    return plotLineItems.value;
  }

  let color;
  if (appStore.currentScenario.runId) {
    color = plotBandsDefaultColor;
  } else {
    const baselineIndex = appStore.currentComparison.scenarios.findIndex(s => s.runId === appStore.baselineScenario?.runId);
    color = timeSeriesColors[baselineIndex % timeSeriesColors.length];
  }

  const plotBandsItem = {
    color: addAlphaToRgb(color, plotBandsRgbAlpha),
    label: "Pandemic response",
    shape: LegendShape.Rectangle,
  };

  return [plotBandsItem, ...plotLineItems.value];
});
</script>
