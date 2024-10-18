<template>
  <div v-show="pageMounted && appStore.globeParameter && appStore.largeScreen">
    <p v-if="false && appStore.currentScenario.parameters && appStore.currentScenario.parameters[appStore.globeParameter!.id]">
      Globe should show the country of... {{ appStore.currentScenario.parameters[appStore.globeParameter!.id] }}
    </p>
    <div ref="globediv" :class="globeClass" />
  </div>
</template>

<script lang="ts" setup>
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
// import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
// import am5geodata_worldHigh from "@amcharts/amcharts5-geodata/worldHigh";

import simplified_WHO_adm0 from "@/assets/geodata/simplified_WHO_adm0";
import simplified_WHO_map_disp_area from "@/assets/geodata/simplified_WHO_map_disp_area";
import WHO_onlyThailand from "@/assets/geodata/WHO_onlyThailand";

// Refer to old branch: 'globe-for-meeting'

let root: am5.Root;

// TODO: Make it zoom in slightly on load, for a fun animation

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const globediv = shallowRef(null);
const pageMounted = ref(false);

// Note from docs just in case:
// In some setups the code might execute before DOM is fully loaded, which would result in error.
// For such cases amCharts provides a wrapper function: am5.ready()
// The above will ensure that the creation of the root element will be delayed until DOM is fully loaded.

let chart;
let zoomControl: am5map.ZoomControl;
let animation: { pause: () => void, stopped: boolean };

const appStore = useAppStore();

const applyGlobeSettings = () => {
  zoomControl.set("visible", appStore.globe.interactive);

  if (!appStore.globe.interactive && !animation.stopped) {
    animation.pause();
  }
};

watchEffect(() => {
  if (globediv.value !== null && !root) {
    root = am5.Root.new(globediv.value);

    // Set button colors, affecting zoom controls
    root.interfaceColors.set("primaryButton", am5.color("#0000cd")); // "Imperial Blue"

    chart = root.container.children.push(
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
      }),
    );

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: simplified_WHO_adm0, // was worldLow for performance
        reverseGeodata: true,
        fill: am5.color("#002e4e"), // Dark blue
      }),
    );

    // chart.series.push(
    //   am5map.MapPolygonSeries.new(root, {
    //     geoJSON: simplified_WHO_map_disp_area,
    //     reverseGeodata: true,
    //     fill: am5.color("#161a1d"), // "Imperial Black"
    //   }),
    // );

    chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: WHO_onlyThailand,
        reverseGeodata: true,
        fill: am5.color("#379f9f") // "Imperial Seaglass"
      }),
    );

    polygonSeries.mapPolygons.template.events.on("click", function(ev) {
      polygonSeries.zoomToDataItem(ev.target.dataItem);
    });

    animation = chart.animate({
      key: "rotationX",
      from: -100, // Initialize map on SE Asia
      to: 260,
      duration: 180000,
      loops: Infinity,
    });

    zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);

    applyGlobeSettings();
  }
});

const globeClass = computed(() => `globe ${appStore.largeScreen ? "large-screen" : ""} ${appStore.globe.interactive ? "interactive" : ""}`);

onMounted(() => {
  pageMounted.value = true;
});

watch(appStore.globe, () => {
  applyGlobeSettings();
});

onBeforeUnmount(() => {
  if (root) {
    root.dispose();
  }
});
</script>

<style lang="scss">
@use "sass:map";
$globeHeight: calc(100dvh - $app-header-height);

.globe {
  width: calc(100% - $sidebar-narrow-width);
  height: $globeHeight;
  max-width: calc(100% - $sidebar-narrow-width);
  max-height: $globeHeight;
  position: absolute; // TODO: make the globe stay still when you scroll down the results page

  transition: filter 1s ease;
  &:not(.interactive) {
    filter: opacity(20%);
    z-index: -1; // Results in the globe being behind elements and thus does not receive clicks (or touches on tablet).
  }

  &.large-screen {
    top: $app-header-height;
    left: $sidebar-narrow-width;
  }
}
</style>
