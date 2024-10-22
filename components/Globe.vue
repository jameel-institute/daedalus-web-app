<template>
  <div v-show="pageMounted && appStore.globeParameter && appStore.largeScreen">
    <div ref="globediv" :class="globeClass" />
  </div>
</template>

<script lang="ts" setup>
import * as am5 from "@amcharts/amcharts5/index";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
// import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
// import am5geodata_worldHigh from "@amcharts/amcharts5-geodata/worldHigh";

// import simplified_WHO_adm0 from "@/assets/geodata/simplified_WHO_adm0";

import WHONationalBorders from "@/assets/geodata/0_point_02_try_again_who_adm0";
import WHODisputedAreas from "@/assets/geodata/0_point_02_try_again_who_disputed_areas";
import { rgba2hex } from "@amcharts/amcharts5/.internal/core/util/Color";

// Refer to old branch: 'globe-for-meeting'

let root: am5.Root;
const imperialSeaGlass = am5.color("#379f9f");
const darkBlue = am5.color("#002e4e");
const midPoint = am5.color("#1c6777");
const lightGreyBackground = am5.color(rgba2hex("rgb(243, 244, 247)"));
const maxZindex = 29; // 30 is reserved by amCharts
const goHomeDuration = 500;
const rotateDuration = 2000;
const geoPointZoomDuration = 2000;
const amountToTiltTheEarthUpwardsBy = 25;
const easing = am5.ease.inOut(am5.ease.cubic);

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
let countrySeries: am5map.MapPolygonSeries;
let backgroundSeries: am5map.MapPolygonSeries;
let disputedAreasLakesSeries: am5map.MapPolygonSeries;
const disputedLandAreasAndDisputers: Record<string, {
  disputers: string[]
  mapSeries: am5map.MapPolygonSeries | null
  displayed: boolean
}> = {
  "Western Sahara": { disputers: ["ESH", "MAR"], mapSeries: null, displayed: false },
  "Abyei": { disputers: ["SSD", "SDN"], mapSeries: null, displayed: false },
  "Aksai Chin": { disputers: ["CHN", "IND"], mapSeries: null, displayed: false },
  "Jammu and Kashmir": { disputers: ["IND", "PAK", "CHN"], mapSeries: null, displayed: false },
};
interface Animation { pause: () => void, stopped: boolean, play: () => void }
let gentleRotateAnimation: Animation;
let graduallyResetYAxis: Animation;
let previousBackgroundPolygon: am5map.MapPolygon | null; ;
let previousPolygon: am5map.MapPolygon | null;
const rotatedToCountry = ref("");
// Disable zoom controls for now since there is a bug where the first click on the zoom in button
// zooms in to a blank area of the map, such that the globe tends to disappear from view.
const disabledZoomControl = true;

const appStore = useAppStore();

const applyGlobeSettings = () => {
  if (!disabledZoomControl) {
    zoomControl.set("visible", appStore.globe.interactive);
  }

  if (!appStore.globe.interactive && !gentleRotateAnimation.stopped) {
    gentleRotateAnimation.pause();
  }
};

// https://www.amcharts.com/docs/v4/tutorials/dynamically-adding-and-removing-series/
const removeSeries = (seriesToRemove: am5map.MapPolygonSeries) => {
  chart.series.removeIndex(
    chart.series.indexOf(seriesToRemove),
  ).dispose();
};

const tentativelySelectedCountrySeries = computed(() => {
  if (!appStore.globe.tentativelySelectedCountry) {
    return null;
  };
  return am5map.MapPolygonSeries.new(root, {
    geoJSON: WHONationalBorders.features.find(f => f.id === appStore.globe.tentativelySelectedCountry),
    reverseGeodata: false,
    fill: midPoint,
    layer: maxZindex - 3,
  });
});

const animateSeriesColour = (series: am5map.MapPolygonSeries, colour: am5.Color) => {
  series.animate({
    key: "fill",
    to: colour,
    duration: geoPointZoomDuration,
    easing,
  });
};

watch(() => globediv.value, (globediv) => {
  if (globediv !== null && !root) {
    root = am5.Root.new(globediv);
    root.setThemes([
      am5themes_Animated.new(root),
    ]);

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

    backgroundSeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHONationalBorders,
      fill: darkBlue,
      reverseGeodata: true,
      layer: maxZindex - 5,
    });
    chart.series.push(backgroundSeries);

    countrySeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHONationalBorders,
      fill: darkBlue,
      reverseGeodata: false,
      layer: maxZindex - 4,
      include: appStore.globeParameter?.options?.map(option => option.id),
    });
    chart.series.push(countrySeries);

    Object.keys(disputedLandAreasAndDisputers).forEach((disputedArea) => {
      const disputedLandSeries = am5map.MapPolygonSeries.new(root, {
        geoJSON: WHODisputedAreas,
        fill: darkBlue,
        reverseGeodata: true,
        include: [disputedArea],
        layer: maxZindex - 1, // Make sure disputed areas are always painted on top of country areas
      });
      disputedLandAreasAndDisputers[disputedArea].mapSeries = disputedLandSeries;
      chart.series.push(disputedLandSeries);
    });

    // disputedAreasLandSeries = am5map.MapPolygonSeries.new(root, {
    //   geoJSON: WHODisputedAreas,
    //   fill: darkBlue,
    //   reverseGeodata: true,
    //   include: Object.keys(disputedLandAreasAndDisputers),
    //   layer: 28, // Make sure disputed areas are always painted on top of country in-fills
    // });
    // chart.series.push(disputedAreasLandSeries);

    disputedAreasLakesSeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHODisputedAreas,
      reverseGeodata: true,
      fill: lightGreyBackground,
      exclude: Object.keys(disputedLandAreasAndDisputers),
      layer: maxZindex, // Make sure lakes are always on top of land
    });
    chart.series.push(disputedAreasLakesSeries);

    backgroundSeries.mapPolygons.template.setAll({
      tooltipText: "{name} is not available",
      toggleKey: "active",
      interactive: true,
    });
    backgroundSeries.mapPolygons.template.on("active", (active, target) => {
      if (previousBackgroundPolygon && previousBackgroundPolygon !== target) {
        previousBackgroundPolygon.set("active", false);
      }
      previousBackgroundPolygon = target;
    });

    countrySeries.mapPolygons.template.setAll({
      tooltipText: "{name}",
      toggleKey: "active",
      interactive: true,
      cursorOverStyle: "pointer",
    });
    countrySeries.mapPolygons.template.on("active", (active, target) => {
      if (previousPolygon && previousPolygon !== target) {
        previousPolygon.set("active", false);
        animateSeriesColour(countrySeries, darkBlue);
      }
      previousPolygon = target;
      if (typeof target?.dataItem?.get("id") === "string") {
        appStore.globe.tentativelySelectedCountry = target.dataItem.get("id");
      }
    });

    countrySeries.mapPolygons.template.states.create("hover", {
      fill: midPoint,
    });

    countrySeries.mapPolygons.template.states.create("active", {
      fill: midPoint,
    });

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

    gentleRotateAnimation = chart.animate({
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

const countryCentroid = (countryIso: string) => countrySeries.getDataItemById(countryIso)?.get("mapPolygon").geoCentroid();

// const zoomToCountry = (countryIso: string) => {
//   const dataItem = countryDataItem(countryIso);

//   if (dataItem) {
//     chart.goHome();
//     countryOptionSeries.zoomToDataItem(dataItem, true);
//   }
// };

const stopDisplayingAllDisputedAreas = () => {
  Object.keys(disputedLandAreasAndDisputers).forEach((disputedArea) => {
    if (disputedLandAreasAndDisputers[disputedArea].displayed && disputedLandAreasAndDisputers[disputedArea].mapSeries) {
      disputedLandAreasAndDisputers[disputedArea].displayed = false;
      animateSeriesColour(disputedLandAreasAndDisputers[disputedArea].mapSeries!, darkBlue);
    }
  });
};

const disputedAreas = (disputer: string) => {
  return Object.keys(disputedLandAreasAndDisputers).filter((disputedArea) => {
    return disputedLandAreasAndDisputers[disputedArea].disputers.includes(disputer);
  });
};

const pauseAnimations = () => {
  if (gentleRotateAnimation && !gentleRotateAnimation.stopped) {
    gentleRotateAnimation.pause();
  }
  if (graduallyResetYAxis && !graduallyResetYAxis.stopped) {
    graduallyResetYAxis.pause();
  }
};

const rotateToCentroid = (centroid: am5.IGeoPoint, countryId: string) => {
  chart.animate({
    key: "rotationX",
    to: -centroid.longitude,
    duration: rotateDuration,
    easing,
  });
  chart.animate({
    key: "rotationY",
    to: (amountToTiltTheEarthUpwardsBy - centroid.latitude),
    duration: rotateDuration,
    easing,
  });
  setTimeout(() => {
    rotatedToCountry.value = countryId;
  }, rotateDuration);
};

// When a country is tentatively selected in the form, re-colour the country area and rotate the globe to it.
watch(() => tentativelySelectedCountrySeries.value, (newSeries, oldSeries) => {
  if (!chart) {
    return;
  }
  if (previousPolygon) {
    previousPolygon.set("active", false);
  }
  if (!appStore.globe.tentativelySelectedCountry) {
    pauseAnimations();
    // Probably the user has navigated back to the home page.
    chart.goHome(goHomeDuration);
    // Reset the globe to zoomed out and slowly spinning.
    const currentRotationX = chart.get("rotationX") || -100;
    rotatedToCountry.value = "";
    // TODO: Make more memory efficient by not re-creating the animations every time
    gentleRotateAnimation = chart.animate({
      key: "rotationX",
      to: currentRotationX + 360,
      duration: 180000,
      loops: Infinity,
    });
    graduallyResetYAxis = chart.animate({
      key: "rotationY",
      to: 0,
      duration: 20000,
    });
  }
  if (oldSeries) {
    stopDisplayingAllDisputedAreas();
    animateSeriesColour(oldSeries, darkBlue);
    setTimeout(() => {
      removeSeries(oldSeries);
    }, geoPointZoomDuration);
  }
  if (newSeries && appStore.globe.tentativelySelectedCountry) {
    pauseAnimations();
    chart.series.push(newSeries);

    const centroid = countryCentroid(appStore.globe.tentativelySelectedCountry);
    if (centroid) {
      if (rotatedToCountry.value !== appStore.globe.tentativelySelectedCountry) {
        rotateToCentroid(centroid, appStore.globe.tentativelySelectedCountry);
      };

      disputedAreas(appStore.globe.tentativelySelectedCountry!).forEach((disputedArea) => {
        disputedLandAreasAndDisputers[disputedArea].displayed = true;
        animateSeriesColour(disputedLandAreasAndDisputers[disputedArea].mapSeries!, midPoint);
      });
      animateSeriesColour(newSeries, imperialSeaGlass);
    }
  }
});

// When a country selection is actually submitted in a form (or a user navigates to
// a results page for a different country), then zoom to that country.
watch(() => [appStore.selectedCountry, rotatedToCountry.value], () => {
  if (!chart || !appStore.selectedCountry) {
    return;
  }
  const centroid = countryCentroid(appStore.selectedCountry);
  if (!centroid) {
    return;
  }
  if (rotatedToCountry.value === appStore.selectedCountry) {
    // Don't zoom to the country until rotating to it is completed.
    chart.zoomToGeoPoint(centroid, 3, true, geoPointZoomDuration);
  } else if (appStore.selectedCountry === appStore.globe.tentativelySelectedCountry) {
    rotateToCentroid(centroid, appStore.selectedCountry);
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
