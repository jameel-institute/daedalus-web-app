<template>
  <div :id="chartContainerId" :class="`${props.hideTooltips ? hideTooltipsClassName : ''}`" />
</template>

<script lang="ts" setup>
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import sunburstInitialize from "highcharts/modules/sunburst";
import { costsPieColors } from "./utils/charts";
import { abbreviateMillionsDollars } from "#imports";

const props = defineProps<{
  hideTooltips: boolean
}>();

accessibilityInitialize(Highcharts);
sunburstInitialize(Highcharts);

const chartContainerId = "costsPieContainerId";
const hideTooltipsClassName = "hide-tooltips";
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";

interface pieCost {
  id: string
  parent: string
  name: string
  value?: number // If value is not provided, Highcharts calculates the children's sum itself.
}
let costsData: pieCost[] = [];

const chartSeries = () => {
  return {
    type: "sunburst",
    data: costsData,
    name: "Root",
    allowDrillToNode: true,
    borderRadius: 3,
    cursor: "pointer",
    dataLabels: {
      format: "{point.name}",
      filter: {
        property: "innerArcLength",
        operator: ">",
        value: 16,
      },
      style: {
        fontSize: "1rem",
      },
    },
    levels: [{
      level: 1,
      levelIsConstant: false,
      dataLabels: {
        filter: {
          property: "outerArcLength",
          operator: ">",
          value: 64,
        },
      },
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
    }, {
      level: 3,
      colorVariation: {
        key: "brightness",
        to: -0.5,
      },
      dataLabels: {
        enabled: false,
      },
      levelSize: {
        unit: "weight",
        value: 2,
      },
    }],
    animation: false,
  };
};
const chartInitialOptions = () => {
  return {
    chart: {
      options3d: {
        enabled: true,
      },
      height: "650px",
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
          X.YZ% of national GDP`;
      },
    },
  } as Highcharts.Options;
};

const appStore = useAppStore();

const getCostLabel = (costId: string) => {
  const name = appStore.metadata?.results.costs.find(cost => cost.id === costId)?.label;
  return name || costId;
};
let chart: Highcharts.Chart;

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
  // the next level of children.
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
    cost.children?.forEach((subCost) => {
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
  top: -220px;
  left: 120px;
  z-index: 10; // Above timeseries

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
}
</style>
