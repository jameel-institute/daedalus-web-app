<template>
  <div>
    <div ref="globediv" :class="globeClass"></div>
    <h3>Non-functional globe to be implemented later</h3>
  </div>
</template>

<script lang="ts" setup>
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

let root: am5.Root;

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const globediv = shallowRef(null);

// Note from docs just in case:
// In some setups the code might execute before DOM is fully loaded, which would result in error.
// For such cases amCharts provides a wrapper function: am5.ready()
// The above will ensure that the creation of the root element will be delayed until DOM is fully loaded.

watchEffect(() => {
  if (globediv.value !== null) {
    root = am5.Root.new(globediv.value);

    let chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoOrthographic(),
        paddingBottom: 20,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        rotationX: -100, // Initialize map on SE Asia
        rotationY: -20,
        wheelX: "none",
        wheelY: "none",
      });
    );

    let polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
      })
    );
  }
});

const props = defineProps<{
  largeScreen: boolean;
}>();

const globeClass = computed(() => `globe ${props.largeScreen ? 'large-screen' : ''}`);

onBeforeUnmount(() => {
  if (root) {
    root.dispose();
  }
});
</script>

<style lang="scss">
.globe {
  width: calc(100% - $container-padding);
  height: $min-wrapper-height;
  max-width: calc(100% - $container-padding);
  max-height: $min-wrapper-height;

  position: absolute;

  &.large-screen {
    top: 20rem;
  }
}
</style>
