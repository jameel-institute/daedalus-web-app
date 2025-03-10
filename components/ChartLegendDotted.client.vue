<template>
  <div
    v-for="item in items"
    :key="item.label"
    class="legend-item legend-item-line"
  >
    <i :style="`border-bottom: 0.25rem ${props.dashed ? 'dashed' : 'dotted'} ${item.color};`" />
    <span>
      {{ item.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape } from "./utils/highCharts";

const props = defineProps<{
  items: LegendItem[]
  rowHeightRem: number
  dashed: boolean
}>();
</script>

<style scoped lang="scss">
$lineHeightRem: 0.15rem;
$rowHeightRem: 1rem;

.legend-container {
  padding: 0.2rem;
}

.legend-item {
  display: table-row;

  span {
    display: table-cell;
    padding-left: 0.5rem;
    vertical-align: bottom;
    white-space: pre;
    font-size: smaller;
    line-height: $rowHeightRem;
  }

  i {
    width: 2.5rem;
    float: left;
    height: 0;
    border-top: none;
    margin-top: calc(($rowHeightRem / 2) - $lineHeightRem);
  }
}
</style>
