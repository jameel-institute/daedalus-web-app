<template>
  <ChartLegend
    :items="items"
    :row-height-rem="1"
    class="costs-legend"
  />
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { type LegendItem, LegendShape } from "./utils/highCharts";

const costsPieColors = ["rgb(44, 175, 254, 1)", "rgb(0, 226, 114, 1)", "rgb(84, 79, 197, 1)"];

const appStore = useAppStore();

const costLabel = (cost: ScenarioCost) => {
  return appStore.metadata?.results.costs.find((costMeta: { id: any }) => costMeta.id === cost.id)?.label;
};

const items = computed((): LegendItem[] => {
  const costsWithColors = appStore.totalCost?.children?.map((cost: ScenarioCost, index: number) => {
    // The first color in costsPieColors is used by the Total cost, is transparent, and not included in the legend.
    return { color: costsPieColors[index], label: costLabel(cost), shape: LegendShape.Circle, value: cost.value };
  }) || [];

  // Drop value property
  return costsWithColors.map((cost: LegendItem) => {
    return { color: cost.color, label: cost.label || "", shape: cost.shape };
  });
});
</script>

<style lang="scss">
.legend-container.costs-legend {
  position: absolute;
  right: 0;
  z-index: 11; // Above costs pie path
  border-radius: 0.25rem;
  box-shadow: var(--cui-box-shadow-sm);
  background-color: white;
  padding: 0.5rem !important;
}
</style>
