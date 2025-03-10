<template>
  <div v-if="props.allLinesColored && !props.diffingAgainstBaseline" class="legend-container m-1 mt-3 me-3 d-flex gap-3">
    <ChartLegendDotted
      :items="[nonBaselineItems[0]]"
      :row-height-rem="0.8"
      :dashed="true"
    />
    <ChartLegend
      :items="[baselineItem]"
      :row-height-rem="0.8"
    />
    <ChartLegendDotted
      :items="[nonBaselineItems[1]]"
      :row-height-rem="0.8"
      :dashed="true"
    />
    <ChartLegendDotted
      :items="[nonBaselineItems[2]]"
      :row-height-rem="0.8"
      :dashed="true"
    />
  </div>
  <div v-if="props.allLinesColored && props.diffingAgainstBaseline" class="legend-container m-1 me-3 d-flex flex-column gap-0">
    <ChartLegend
      :items="[nonBaselineItems[0]]"
      :row-height-rem="0.8"
    />
    <ChartLegend
      :items="[nonBaselineItems[1]]"
      :row-height-rem="0.8"
    />
    <ChartLegend
      :items="[nonBaselineItems[2]]"
      :row-height-rem="0.8"
    />
  </div>
  <div :class="`legend-container d-flex flex-column gap-1 m-1 ${props.allLinesColored && props.diffingAgainstBaseline ? 'mt-3' : ''}`">
    <ChartLegend
      :items="[items[0]]"
      :row-height-rem="1.5"
    />
    <ChartLegendDotted
      v-if="!diffingAgainstBaseline"
      :items="[items[1]]"
      :row-height-rem="1"
      :dashed="false"
    />
  </div>
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape, plotBandsColor, plotLinesColor, timeSeriesColors } from "./utils/highCharts";

const props = defineProps<{
  allLinesColored: boolean
  diffingAgainstBaseline: boolean
}>();

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

const baselineItem = computed(() => {
  return { color: timeSeriesColors[0] as string, label: "Low (Baseline)", shape: LegendShape.Line };
});

const nonBaselineItems = computed(() => {
  return [
    { color: timeSeriesColors[1] as string, label: "None", shape: LegendShape.Line },
    { color: timeSeriesColors[2] as string, label: "Medium", shape: LegendShape.Line },
    { color: timeSeriesColors[3] as string, label: "High", shape: LegendShape.Line },
  ];
});
</script>
