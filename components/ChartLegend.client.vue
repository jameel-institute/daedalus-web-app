<template>
  <div
    v-for="item in items"
    :key="item.label"
    :class="`legend-item legend-item-${item.shape}`"
  >
    <i :style="iStyle(item)" />
    <span
      :style="{ lineHeight: `${props.rowHeightRem}rem` }"
    >
      {{ item.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape } from "./utils/highCharts";

const props = defineProps<{
  items: LegendItem[]
  rowHeightRem: number
}>();

const lineHeightRem = 0.15;

const iStyle = (item: LegendItem) => {
  const style = {
    background: item.color,
  };
  if (item.shape === LegendShape.Line) {
    return {
      ...style,
      height: `${lineHeightRem}rem`,
      marginTop: `${(props.rowHeightRem / 2) - lineHeightRem}rem`,
    };
  } else if (item.shape === LegendShape.Circle) {
    return {
      ...style,
      borderRadius: "50%",
      height: `${props.rowHeightRem / 1.3}rem`,
      width: `${props.rowHeightRem / 1.3}rem`,
    };
  } else if (item.shape === LegendShape.Rectangle) {
    return {
      ...style,
      height: `${props.rowHeightRem}rem`,
    };
  };
};
</script>

<style lang="scss">
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
  }

  i {
    width: 2.5rem;
    float: left;
  }
}
</style>
