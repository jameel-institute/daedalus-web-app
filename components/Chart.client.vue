<template>
  <div class="hello" ref="chartdiv">
  </div>
</template>

<script setup lang="ts">
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

let root: am5.Root;

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const chartdiv = shallowRef(null);

// Note from docs just in case:
// In some setups the code might execute before DOM is fully loaded, which would result in error.
// For such cases amCharts provides a wrapper function: am5.ready()
// The above will ensure that the creation of the root element will be delayed until DOM is fully loaded.

onMounted(() => {
  if (!chartdiv.value) return;

  root = am5.Root.new(chartdiv.value);

  root.setThemes([am5themes_Animated.new(root)]);

  let chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panY: false,
      layout: root.verticalLayout
    })
  );

  let data = [{
      category: "Research",
      value1: 1000,
      value2: 588
          },
    {
      category: "Marketing",
      value1: 1200,
      value2: 1800
    }, {
      category: "Sales",
      value1: 850,
      value2: 1230
    }
  ];

  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  let xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      renderer: am5xy.AxisRendererX.new(root, {}),
      categoryField: "category"
    })
  );
  xAxis.data.setAll(data);

  let series1 = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Series",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value1",
      categoryXField: "category"
    })
  );
  series1.data.setAll(data);

  let series2 = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Series",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value2",
      categoryXField: "category"
    })
  );
  series2.data.setAll(data);

  let legend = chart.children.push(am5.Legend.new(root, {}));
  legend.data.setAll(chart.series.values);

  chart.set("cursor", am5xy.XYCursor.new(root, {}));
});

onBeforeUnmount(() => {
  if (root) root.dispose();
});
</script>

<style scoped>
.hello {
  width: 100%;
  height: 500px;
}
</style>