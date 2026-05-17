<template>
  <div class="bg-white rounded border d-flex align-items-center gap-3 px-2 py-1 shadow-sm">
    <Legend
      v-for="itemColumn in itemsInColumns"
      :key="itemColumn[0].label"
      :items="itemColumn"
      :row-height-rem="1"
      class="p-0 flex-wrap column-gap-3 row-gap-1"
    />
  </div>
</template>

<script setup lang="ts">
import type { ScenarioCost } from "~/types/resultTypes";
import { brightColors, type LegendItem, LegendShape } from "../../utils/charts";

const appStore = useAppStore();

const palette = brightColors;

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

// Lay out items in columns manually since the implementation of 'flex-direction: column'
// while applying flex wrap differs between Safari/Firefox/Chrome.
const itemsInColumns = computed(() => {
  const columns = [];
  const itemsPerColumn = 2;
  for (let i = 0; i < items.value.length; i += itemsPerColumn) {
    columns.push(items.value.slice(i, i + itemsPerColumn));
  }
  return columns;
});
</script>

<style scoped lang="scss">
:deep(.legend-container) {
  max-height: 2.3rem;
  margin: 0 !important;
}
</style>
