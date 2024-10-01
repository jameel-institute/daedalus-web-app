<template>
  <div class="legend-container ms-3 m-1">
    <div class="legend-element">
      <div class="legend-item legend-item-square">
        <i :style="{ background: plotBandsColor }" />
        <span class="level">Pandemic response</span>
      </div>
      <div class="legend-item legend-item-line">
        <i :style="{ background: plotLinesColor }" />
        <span class="level">{{ capacityLabel }}</span>
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
