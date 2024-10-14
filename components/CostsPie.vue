<template>
  <div
    :id="chartContainerId"
    :class="`${props.hideTooltips ? hideTooltipsClassName : ''} ${props.pieClass}`"
    :style="`width: ${props.pieSize}px; height: ${props.pieSize}px; right: ${props.rightPosition}px;`"
  />
</template>

<script lang="ts" setup>
import { abbreviateMillionsDollars } from "#imports";
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import sunburstInitialize from "highcharts/modules/sunburst";
import { costsPieColors } from "./utils/charts";

const props = defineProps<{
  hideTooltips: boolean
  pieSize?: number
  pieClass: string
  rightPosition?: number
}>();
accessibilityInitialize(Highcharts);
sunburstInitialize(Highcharts);
const chartContainerId = "costsPieContainerId";
const hideTooltipsClassName = "hide-tooltips";
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";
let chart: Highcharts.Chart;

const appStore = useAppStore();

interface pieCost {
  id: string
  parent: string
  name: string
  value?: number // If value is not provided, Highcharts calculates the children's sum itself.
}
let costsData: pieCost[] = [];

// Prioritise showing labels for larger slices over smaller slices, where labels would otherwise overlap.
const lowerLevelsDataLabelFilter = {
  property: "innerArcLength",
  operator: ">",
  value: 16,
};

const chartLevelsOptions = (isDrillingDown: boolean = false) => [{
  level: 1,
  levelIsConstant: false,
  levelSize: {
    unit: "weight",
    value: 1,
  },
}, {
  level: 2,
  colorByPoint: true,
  levelSize: {
    unit: "weight",
    value: 2,
  },
  dataLabels: {
    filter: isDrillingDown ? undefined : lowerLevelsDataLabelFilter,
  },
}, {
  level: 3,
  colorVariation: {
    key: "brightness",
    to: -0.75,
  },
  dataLabels: {
    enabled: isDrillingDown,
    filter: lowerLevelsDataLabelFilter,
    style: {
      fontSize: "0.9rem",
    },
  },
  levelSize: {
    unit: "weight",
    value: 2,
  },
}];

const chartSeries = () => {
  return {
    type: "sunburst",
    data: costsData,
    name: "Root",
    allowDrillToNode: true,
    borderRadius: 3,
    cursor: "pointer",
    events: {
      click(event) {
        // When the clicked chart 'point' is in the second level of the sunburst,
        // that means some drilling down or up (traversing up and down the chart) is triggered.
        const isDrilling = event.point.node.level !== 1 && event.point.node.children.length > 0; // No drill-down if no children to drill down to;
        if (!isDrilling) {
          return;
        }
        const isDrillingUp = event.point.drillId === appStore.totalCost?.id;
        const isDrillingDown = isDrilling && !isDrillingUp;
        chart.update({ series: { levels: chartLevelsOptions(isDrillingDown) } });
      },
    },
    dataLabels: {
      rotation: 0,
      rotationMode: "auto", // Without this, labels sometimes appear in the top left at random. https://github.com/highcharts/highcharts/issues/18953
      format: "{point.name}",
      style: {
        fontSize: "1.1rem", // TODO: Make font-size smaller on small screens
        fontWeight: 500,
        textOutline: "grey",
        textShadow: "0px 0px 2.5px black",
        color: "white",
      },
      allowOverlap: false,
    },
    levels: chartLevelsOptions(),
    animation: false,
  } as Highcharts.SeriesOptions;
};
const chartInitialOptions = () => {
  return {
    chart: {
      spacing: [0, 0, 0, 0],
      options3d: {
        enabled: true,
      },
      height: props.pieSize,
      width: props.pieSize,
      backgroundColor: chartBackgroundColor,
      events: {
        fullscreenOpen() {
          this.update({ chart: { backgroundColor: chartBackgroundColorOnExporting } });
        },
        fullscreenClose() {
          this.update({ chart: { backgroundColor: chartBackgroundColor } });
        },
      },
      style: {
        fontFamily: "ImperialSansText, sans-serif", // TODO: Make the font-family derive from a globally configurable constant
      },
    },
    exporting: { enabled: false },
    navigation: {
      breadcrumbs: {
        position: {
          verticalAlign: "bottom",
          align: "center",
        },
        showFullPath: false,
      },
    },
    colors: costsPieColors,
    title: {
      text: "",
      style: {
        color: "white",
      },
    },
    series: [chartSeries()],
    tooltip: {
      pointFormatter() {
        const abbr = abbreviateMillionsDollars(this.value);
        return `
          <b>${this.name}</b><br/>
          $${abbr.amount} ${abbr.unit}<br/>
          X.Y% of national GDP`;
      },
    },
  } as Highcharts.Options;
};
const getCostLabel = (costId: string) => {
  const name = appStore.metadata?.results.costs.find(cost => cost.id === costId)?.label;
  return name || costId;
};
const populateCostsDataIntoPie = () => {
  if (!appStore.totalCost) {
    return;
  }
  costsData = [];
  costsData.push({
    id: appStore.totalCost.id,
    parent: "",
    name: getCostLabel(appStore.totalCost.id),
    value: appStore.totalCost?.value,
  });
  // Iterate over first level of children before recursing into the next level,
  // so that earlier pieCostsColors are assigned to top-level children before
  // the next level of children. (Using recursion changes the color assignment order.)
  appStore.totalCost.children?.forEach((cost) => {
    costsData.push({
      id: cost.id,
      parent: appStore.totalCost!.id,
      name: getCostLabel(cost.id),
      value: cost.value,
    });
  });

  // Iterate over second level of children, for a total of 3 levels.
  // For now, we are hard-coding an expectation of 3 levels.
  appStore.totalCost.children?.forEach((cost) => {
    // Omit sub-costs with a value of zero
    cost.children?.filter(subCost => subCost.value !== 0)?.forEach((subCost) => {
      costsData.push({
        id: subCost.id,
        parent: cost.id,
        name: getCostLabel(subCost.id),
        value: subCost.value,
      });
    });
  });
  chart.series[0].setData(costsData);
};

watch(() => appStore.costsData, () => {
  if (appStore.costsData) {
    populateCostsDataIntoPie();
  }
});

watch(() => props.pieSize, () => {
  if (chart && props.pieSize) {
    chart.setSize(props.pieSize, props.pieSize, { duration: 250 });
  }
});

onMounted(() => {
  chart = Highcharts.chart(chartContainerId, chartInitialOptions());
  if (appStore.costsData) {
    populateCostsDataIntoPie();
  }
});

onUnmounted(() => {
  // Destroy this chart, otherwise every time we navigate away and back to this page, another set
  // of charts is created, burdening the browser.
  chart.destroy();
});
</script>

<style lang="scss">
#costsPieContainerId {
  font-weight: normal !important;
  position: absolute;
  z-index: 10; // Above timeseries

  &.top-right-corner {
    top: 0;
  }

  &.below-usd-total-cost {
    bottom: 0;
  }

  &.bottom-right-corner {
    bottom: 0;
  }

  .highcharts-tooltip {
    transition: filter 0.2s;
  }
  &.hide-tooltips {
    .highcharts-tooltip {
      filter: opacity(0);
    }
  }
  .highcharts-point { // Avoid transparency on hover over pie slices
    opacity: 1 !important;
  }
  .highcharts-container {
    margin-left: auto;
  }
}
</style>
