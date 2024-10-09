<template>
  <div class="legend-container">
    <div class="legend-element d-flex flex-column gap-1">
      <div v-for="item in items" :key="item.label" :class="`legend-item legend-item-${item.shape}`">
        <i :style="{ background: item.color }" />
        <span class="level">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { costsPieColors } from "./utils/charts";
import type { ScenarioCost } from "~/types/resultTypes";

const appStore = useAppStore();

const costLabel = (cost: ScenarioCost) => {
  return appStore.metadata?.results.costs.find(costMeta => costMeta.id === cost.id)?.label;
};

const items = computed(() => {
  const costsWithColors = appStore.totalCost?.children?.map((cost: ScenarioCost, index) => {
    return { color: costsPieColors[index + 1], label: costLabel(cost), shape: "square", value: cost.value };
  });

  return [...(costsWithColors || [])].sort((a, b) => b.value - a.value);
});
</script>

<style scoped lang="scss">
$row-height: 0.75rem;
$plot-line-height: 0.15rem;
.legend-container {
  padding: 0.2rem;
  align-items: center;
  display: flex;
}
.legend-element {
  vertical-align: bottom;
}
.legend-item {
  height: $row-height;
  display: table-row;
  span {
    line-height: $row-height;
    display: table-cell;
    padding-left: 0.5rem;
    vertical-align: bottom;
    white-space: pre;
    font-size: smaller;
  }
  &.legend-item-square {
    i {
      width: 3rem;
      height: $row-height;
      float: left;
    }
  }
  &.legend-item-line {
    i {
      width: 3rem;
      height: $plot-line-height;
      float: left;
      margin-top: calc(($row-height / 2) - $plot-line-height);
    }
  }
}
</style>
