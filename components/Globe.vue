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
import worldOutline from "@amcharts/amcharts5-geodata/worldOutlineLow";
// import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
// import am5geodata_worldHigh from "@amcharts/amcharts5-geodata/worldHigh";

// import simplified_WHO_adm0 from "@/assets/geodata/simplified_WHO_adm0";

import WHONationalBorders from "@/assets/geodata/0_point_02_try_again_who_adm0";
import WHODisputedAreas from "@/assets/geodata/0_point_02_try_again_who_disputed_areas";

// Refer to old branch: 'globe-for-meeting'

let root: am5.Root;
const imperialBlue = am5.color("#0000cd");

// TODO: Make it zoom in slightly on load, for a fun animation

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const globediv = shallowRef(null);
const pageMounted = ref(false);

// Note from docs just in case:
// In some setups the code might execute before DOM is fully loaded, which would result in error.
// For such cases amCharts provides a wrapper function: am5.ready()
// The above will ensure that the creation of the root element will be delayed until DOM is fully loaded.

let chart: am5map.MapChart;

let zoomControl: am5map.ZoomControl;
let animation: { pause: () => void, stopped: boolean };
// Disable zoom controls for now since there is a bug where the first click on the zoom in button
// zooms in to a blank area of the map, such that the globe tends to disappear from view.
const disabledZoomControl = true;

const appStore = useAppStore();

const applyGlobeSettings = () => {
  if (!disabledZoomControl) {
    zoomControl.set("visible", appStore.globe.interactive);
  }

  if (!appStore.globe.interactive && !animation.stopped) {
    animation.pause();
  }
};

const removeSeries = (seriesToRemove: am5map.MapPolygonSeries) => {
  chart.series.removeIndex(
    chart.series.indexOf(seriesToRemove),
  ).dispose();
};

watchEffect(() => {
  if (globediv.value !== null && !root) {
    root = am5.Root.new(globediv.value);

    // Set button colors, affecting zoom controls
    // root.interfaceColors.set("primaryButton", am5.color("#0000cd")); // "Imperial Blue"

    chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "none", // Disable drag-to-rotate for v1 of app (was "rotateX")
        panY: "none", // Disable drag-to-rotate for v1 of app (was "rotateY")
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

    // We only need to draw the boundaries of countries that are available in the model.
    // So we start by painting a backdrop of the world's geographical outline.
    const worldOutlineSeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: worldOutline,
      fill: imperialBlue,
    });
    worldOutlineSeries.mapPolygons.template.setAll({
      brightness: 0.2,
    });
    chart.series.push(worldOutlineSeries);
    // Next, we paint over that outline, for each of the countries that are available in the model.
    const countryOptionSeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHONationalBorders,
      reverseGeodata: true,
      include: appStore.globeParameter?.options?.map(o => o.id),
      fill: imperialBlue,
    });
    countryOptionSeries.mapPolygons.template.setAll({
      brightness: 0.4,
    });
    chart.series.push(countryOptionSeries);

    const oneCountrySeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHONationalBorders.features.find(f => f.id === "THA"),
      reverseGeodata: false,
      fill: imperialBlue,
    });
    oneCountrySeries.mapPolygons.template.setAll({
      brightness: 1,
      strokeWidth: 2,
    });
    chart.series.push(oneCountrySeries);

    // const polygonSeries = chart.series.push(
    //   am5map.MapPolygonSeries.new(root, {
    //     geoJSON: WHONationalBorders, // was worldLow for performance
    //     fill: am5.color("#002e4e"), // Dark blue
    //   }),
    // );

    // chart.series.push(
    //   am5map.MapPolygonSeries.new(root, {
    //     geoJSON: WHODisputedAreas,
    //     reverseGeodata: true,
    //     fill: am5.color("#161a1d"), // "Imperial Black"
    //   }),
    // );

    // chart.series.push(
    //   am5map.MapPolygonSeries.new(root, {
    //     geoJSON: WHO_onlyThailand,
    //     reverseGeodata: true,
    //     fill: am5.color("#379f9f"), // "Imperial Seaglass"
    //   }),
    // );

    // const USASeries = am5map.MapPolygonSeries.new(root, {
    //   geoJSON: WHONationalBorders.features.find((d) => d.id === "USA"),
    //   reverseGeodata: false,
    //   fill: am5.color("#444444"),
    // });
    // chart.series.push(USASeries);

    // setTimeout(() => {
    //   removeSeries(USASeries);
    // }, 4000);

    // polygonSeries.mapPolygons.template.events.on("click", (ev) => {
    //   polygonSeries.zoomToDataItem(ev.target.dataItem);
    // });

    animation = chart.animate({
      key: "rotationX",
      from: -100, // Initialize map on SE Asia
      to: 260,
      duration: 180000,
      loops: Infinity,
    });

    if (!disabledZoomControl) {
      zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
      zoomControl.homeButton.set("visible", true);
    }

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
