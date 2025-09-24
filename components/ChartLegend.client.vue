<template>
  <div class="legend-container m-1 d-flex flex-column gap-1">
    <div
      v-for="item in items"
      :key="item.label"
      class="legend-item"
    >
      <!-- The svg is modelled after the plot-line graphic used in the Highcharts chart -->
      <svg
        v-if="item.shape === LegendShape.SquareDash"
        :width="iWidthPx"
        :height="plotLinesWidthPx"
        :style="{ marginTop: lineMarginTop }"
      >
        <path
          :stroke="item.color"
          :stroke-width="plotLinesWidthPx * 2"
          :stroke-dasharray="`${plotLinesWidthPx},${plotLinesWidthPx}`"
          :d="`M 0 0 L ${iWidthPx} 0`"
        />
      </svg>
      <i v-else :style="iStyle(item)" />
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
import { plotLinesWidthPx } from "./utils/timeSeriesCharts";

const props = defineProps<{
  items: LegendItem[]
  rowHeightRem: number
}>();

// Width of the i element should be an odd-numbered multiple of plotLinesWidthPx to ensure dotted svg paths start and finish
// with dots rather than gap, aligning them visually with non-dotted legend items.
const iWidthPx = 19 * plotLinesWidthPx;
const lineHeightRem = 0.15;
const lineMarginTop = `${(props.rowHeightRem / 2) - (lineHeightRem / 2)}rem`;

const iStyle = (item: LegendItem) => {
  const style = {
    background: item.color,
    width: `${iWidthPx}px`,
  };
  if (item.shape === LegendShape.Line) {
    return {
      ...style,
      height: `${lineHeightRem}rem`,
      marginTop: lineMarginTop,
    };
  } else if (item.shape === LegendShape.Circle) {
    const circleDiameter = "11px";
    return {
      ...style,
      borderRadius: "50%",
      height: circleDiameter,
      width: circleDiameter,
    };
  } else if (item.shape === LegendShape.Rectangle) {
    return {
      ...style,
      height: `${props.rowHeightRem}rem`,
    };
  };
};
</script>

<style scoped lang="scss">
.legend-container {
  padding: 0.2rem;
}

.legend-item {
  display: flex;

  span {
    padding-left: 0.5rem;
    vertical-align: bottom;
    white-space: pre;
    font-size: smaller;
  }

  i {
    float: left;
  }
}
</style>
