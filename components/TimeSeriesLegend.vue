<template>
  <div class="legend-container ms-3 m-1">
    <div class="legend-element d-flex flex-column gap-1">
      <div v-for="item in items" :key="item.label" :class="`legend-item legend-item-${item.shape}`">
        <i :style="{ background: item.color }" />
        <span class="level">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { plotBandsColor, plotLinesColor } from "./utils/charts";

const appStore = useAppStore();

const capacityLabel = computed(() => {
  return appStore.metadata?.results.capacities[0].label; // At first, we expect there to be only one capacity, 'Hospital capacity'
});

const items = computed(() => {
  return [
    { color: plotBandsColor, label: "Pandemic response", shape: "square" },
    { color: plotLinesColor, label: capacityLabel.value, shape: "line" },
  ];
});
</script>

<style scoped lang="scss">
$row-height: 1rem;
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
