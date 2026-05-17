<template>
  <Legend
    :items="items"
    :row-height-rem="0.9"
    class="bg-white mb-3 shadow-sm border rounded p-2 w-fit"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { colorBlindSafeLargePalette, type LegendItem, LegendShape } from "../../utils/charts";
import { plotLinesColorName } from "../utils/timeSeriesCharts";

const appStore = useAppStore();

const palette = colorBlindSafeLargePalette.filter(c => c.name !== plotLinesColorName);

const items = computed((): LegendItem[] =>
  appStore.currentComparison.scenarios[0].result.data?.costs[0].children
    ?.find((cost: ScenarioCost) => cost.id === "life_years")
    ?.children
    ?.map((subCost: ScenarioCost, index: number) => {
      return {
        color: palette[index].rgb,
        label: appStore.getCostLabel(subCost.id),
        shape: LegendShape.Circle,
      };
    }) || [],
);
</script>
