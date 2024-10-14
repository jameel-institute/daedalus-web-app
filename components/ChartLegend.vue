<template>
  <div class="legend-container m-1">
    <div class="legend-element d-flex flex-column gap-1">
      <div
        v-for="item in items"
        :key="item.label"
        :class="`legend-item legend-item-${item.shape}`"
        :style="legendItemStyle(item)"
      >
        <i :style="iStyle(item)" />
        <span
          class="level"
          :style="{ lineHeight: `${props.rowHeightRem}rem` }"
        >
          {{ item.label }}
        </span>
      </div>
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
  align-items: center;
  display: flex;
}
.legend-element {
  vertical-align: bottom;
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
  &.legend-item-rectangle {
    i {
      width: 2.5rem;
      float: left;
    }
  }
  &.legend-item-line {
    i {
      width: 2.5rem;
      float: left;
    }
  }
}
</style>
