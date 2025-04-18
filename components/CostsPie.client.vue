<template>
  <div class="position-relative">
    <CostsLegend />
    <div
      :id="chartContainerId"
      ref="chartContainer"
      :class="[props.hideTooltips ? hideTooltipsClassName : '']"
      :data-summary="JSON.stringify(costsData)"
    />
  </div>
</template>

<script lang="ts" setup>
import * as Highcharts from "highcharts";
import accessibilityInitialize from "highcharts/modules/accessibility";
import sunburstInitialize from "highcharts/modules/sunburst";
import throttle from "lodash.throttle";
import { costsPieColors, costsPieTooltipText } from "./utils/highCharts";

const props = defineProps<{
  hideTooltips: boolean
}>();

accessibilityInitialize(Highcharts);
sunburstInitialize(Highcharts);

interface pieCost {
  id: string
  parent: string
  name: string
  value?: number // If value is not provided, Highcharts calculates the children's sum itself.
}

const appStore = useAppStore();
const chartContainerId = "costsChartContainer";
const hideTooltipsClassName = "hide-tooltips";
const chartBackgroundColor = "transparent";
const chartBackgroundColorOnExporting = "white";
let chart: Highcharts.Chart;
const costsData = ref<pieCost[]>([]); // This is only implemented as ref for testing purposes, via the data-summary attribute.
const pieSize = computed(() => appStore.largeScreen ? 450 : 300);
const chartContainer = ref<HTMLElement | null>(null);

// Prioritise showing labels for larger slices over smaller slices, where labels would otherwise overlap.
const lowerLevelsDataLabelFilter: Highcharts.DataLabelsFilterOptionsObject = {
  property: "innerArcLength",
  operator: ">",
  value: 16,
};

const defaultDataLabelStyle: Highcharts.CSSObject = {
  fontSize: "1rem",
  fontWeight: "500",
  textOutline: "none",
  textShadow: "0px 0px 4px black",
  color: "white",
};
const topLevelDataLabelStyle: Highcharts.CSSObject = {
  fontSize: "0.8rem",
  textShadow: "none",
  textOutline: "none",
  color: "var(--cui-card-color)",
  backgroundColor: "green",
};

const levelSizesWhen3Levels = {
  inner: 1,
  mid: 2,
  outer: 1,
};
const levelSizesWhen2Levels = {
  inner: 2,
  outer: 1,
};

const chartLevelsOptions = (isDrillingDown: boolean = false): Array<Highcharts.PlotSunburstLevelsOptions> => [{
  level: 1,
  levelIsConstant: false,
  levelSize: {
    unit: "weight",
    value: isDrillingDown ? 0 : levelSizesWhen3Levels.inner,
  },
  dataLabels: {
    style: isDrillingDown ? defaultDataLabelStyle : topLevelDataLabelStyle,
  },
}, {
  level: 2,
  colorByPoint: true,
  levelSize: {
    unit: "weight",
    value: isDrillingDown ? levelSizesWhen2Levels.inner : levelSizesWhen3Levels.mid,
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
      fontWeight: "400",
      fontSize: "0.8rem",
    },
  },
  levelSize: {
    unit: "weight",
    value: isDrillingDown ? levelSizesWhen2Levels.outer : levelSizesWhen3Levels.outer,
  },
}];

const chartSeries = () => {
  return {
    type: "sunburst",
    data: costsData.value, // Empty at initialisation, populated later
    name: "Root",
    allowDrillToNode: true,
    borderRadius: 0,
    borderWidth: 0.5,
    borderColor: "white",
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
      formatter() {
        if (this.point.index === 0) {
          return "Losses";
        } else {
          return this.point.name;
        };
      },
      style: defaultDataLabelStyle,
      allowOverlap: false,
    },
    levels: chartLevelsOptions(),
    animation: false,
  } as Highcharts.SeriesSunburstOptions;
};

const chartInitialOptions = () => {
  return {
    credits: {
      text: "Highcharts",
    },
    chart: {
      spacing: [0, 0, 0, 0],
      options3d: {
        enabled: true,
      },
      height: pieSize.value,
      width: pieSize.value,
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
        events: {
          click() {
            chart.update({ series: { levels: chartLevelsOptions(false) } });
          },
        },
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
        return costsPieTooltipText(this, appStore.currentScenario.result.data!.gdp);
      },
    },
  } as Highcharts.Options;
};

const populateCostsDataIntoPie = () => {
  if (!appStore.totalCost) {
    return;
  }
  const data = [{
    id: appStore.totalCost.id,
    parent: "",
    name: appStore.getCostLabel(appStore.totalCost.id),
    value: appStore.totalCost?.value,
  }];
  // Iterate over first level of children before recursing into the next level,
  // so that earlier pieCostsColors are assigned to top-level children before
  // the next level of children. (Using recursion changes the color assignment order.)
  appStore.totalCost.children?.forEach((cost) => {
    data.push({
      id: cost.id,
      parent: appStore.totalCost!.id,
      name: appStore.getCostLabel(cost.id),
      value: cost.value,
    });
  });

  // Iterate over second level of children, for a total of 3 levels.
  // For now, we are hard-coding an expectation of 3 levels.
  appStore.totalCost.children?.forEach((cost) => {
    // Omit sub-costs with a value of zero
    cost.children?.filter(subCost => subCost.value !== 0)?.forEach((subCost) => {
      data.push({
        id: subCost.id,
        parent: cost.id,
        name: appStore.getCostLabel(subCost.id),
        value: subCost.value,
      });
    });
  });
  costsData.value = data;
  chart.series[0].setData(costsData.value);
};

watch(() => appStore.costsData, () => {
  if (appStore.costsData) {
    populateCostsDataIntoPie();
  }
});

watch(() => appStore.largeScreen, throttle(() => {
  if (chart) {
    chart.setSize(pieSize.value, pieSize.value, { duration: 250 });
  }
}, 25));

watch(() => chartContainer.value, () => {
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
#costsChartContainer {
  font-weight: normal !important;
  z-index: 10; // Above timeseries, below costs pie legend

  .highcharts-tooltip {
    transition: filter 0.2s;
  }

  &.hide-tooltips {
    .highcharts-tooltip {
      filter: opacity(0);
    }
  }

  .highcharts-point {
    opacity: 1 !important; // Avoid transparency on hover over pie slices
  }

  .highcharts-container {
    margin-left: auto;
  }
}
</style>
