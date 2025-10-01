<template>
  <Legend
    :items="items"
    :row-height-rem="0.9"
    class="bg-white mb-3 shadow-sm border rounded p-2 w-fit"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { type LegendItem, LegendShape } from "../../utils/charts";
import { costsChartPalette } from "../utils/costCharts";

const appStore = useAppStore();

const items = computed((): LegendItem[] =>
  appStore.currentComparison.scenarios[0].result.data?.costs[0].children?.map((cost: ScenarioCost, index: number) => {
    return {
      color: costsChartPalette[index].rgb,
      label: appStore.getCostLabel(cost.id),
      shape: LegendShape.Circle,
    };
  }) || [],
);
</script>
