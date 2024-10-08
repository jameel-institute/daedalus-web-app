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

const appStore = useAppStore();
const costLabels = computed(() => {
  return appStore.totalCost?.children?.map((cost) => {
    return appStore.metadata?.results.costs.find(costMeta => costMeta.id === cost.id)?.label;
  });
});
const items = computed(() => {
  return costLabels.value?.map((label, index) => {
    return { color: costsPieColors[index + 1], label, shape: "square" };
  });
});
</script>

<style scoped lang="scss">
$row-height: 1.2rem;
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
