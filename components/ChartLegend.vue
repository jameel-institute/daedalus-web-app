<template>
  <div class="legend-container m-1 d-flex flex-column gap-1">
    <div
      v-for="item in items"
      :key="item.label"
      :class="`legend-item legend-item-${item.shape}`"
      :style="legendItemStyle(item)"
    >
      <i :style="iStyle(item)" />
      <span
        :style="{ lineHeight: `${props.rowHeightRem}rem` }"
      >
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type LegendItem, LegendShape } from "./utils/charts";

const props = defineProps<{
  items: LegendItem[]
  rowHeightRem: number
}>();

const lineHeightRem = 0.15;

const legendItemStyle = (item: LegendItem) => {
  if (item.shape === LegendShape.Rectangle) {
    return {
      height: `${props.rowHeightRem}rem`,
    };
  } else {
    return {};
  }
};

const iStyle = (item: LegendItem) => {
  const style = {
    background: item.color,
    height: item.shape === LegendShape.Rectangle ? `${props.rowHeightRem}rem` : `${lineHeightRem}rem`,
  };
  if (item.shape === LegendShape.Line) {
    return {
      ...style,
      marginTop: `${(props.rowHeightRem / 2) - lineHeightRem}rem`,
    };
  } else {
    return style;
  };
};
</script>

<style scoped lang="scss">
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
