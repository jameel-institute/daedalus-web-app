<template>
  <div
    v-show="appStore.globeParameter && appStore.largeScreen"
    @mousedown="deselectText"
    @touchstart="deselectText"
    @mousemove="avoidSelectingText"
  >
    <div ref="globediv" :class="globeClass" />
  </div>
</template>

<script lang="ts" setup>
import type { MultiPolygon } from "geojson";
import WHONationalBorders from "@/assets/geodata/2pc_downsampled_WHO_adm0_22102024";
import WHODisputedAreas from "@/assets/geodata/2pc_downsampled_WHO_disputed_areas_22102024";
import { rgba2hex } from "@amcharts/amcharts5/.internal/core/util/Color";
import * as am5 from "@amcharts/amcharts5/index";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import throttle from "lodash.throttle";

const activeCountryColor = am5.color("#379f9f"); // Imperial sea-glass
const fill = am5.color("#002e4e"); // A default land colour: dark blue
const hoverLandColour = am5.color("#1c6777"); // The midpoint between defaultLandColour and activeCountryColor
const lightGreyBackground = am5.color(rgba2hex("rgb(243, 244, 247)"));
const maxZindex = 29; // 30 is reserved by amCharts

// Animation variables
const southEastAsiaXCoordinate = -100;
const goHomeDuration = 500;
const rotateDuration = 2000;
const geoPointZoomDuration = 2000;
const amountToTiltTheEarthUpwardsBy = 25;
const easing = am5.ease.inOut(am5.ease.cubic);
interface Animation { pause: () => void, stopped: boolean, play: () => void }
let gentleRotateAnimation: Animation;
let graduallyResetYAxis: Animation;

let root: am5.Root;
let chart: am5map.MapChart;
let selectableCountriesSeries: am5map.MapPolygonSeries;
let backgroundSeries: am5map.MapPolygonSeries;
let disputedBodiesOfWater: am5map.MapPolygonSeries;
let prevBackgroundPolygon: am5map.MapPolygon | undefined;
let prevPolygon: am5map.MapPolygon | undefined;
const chartDefaultSettings: am5map.IMapChartSettings = {
  panX: "rotateX",
  panY: "rotateY",
  projection: am5map.geoOrthographic(),
  paddingBottom: 20,
  paddingTop: 20,
  paddingLeft: 20,
  paddingRight: 20,
  wheelX: "none",
  wheelY: "none",
  rotationX: southEastAsiaXCoordinate, // Initialize map on SE Asia
  rotationY: -20,
};
const disputedLands: Record<string, {
  disputers: string[]
  mapSeries: am5map.MapPolygonSeries | null
  displayed: boolean
}> = {
  "Western Sahara": { disputers: ["ESH", "MAR"], mapSeries: null, displayed: false },
  "Abyei": { disputers: ["SSD", "SDN"], mapSeries: null, displayed: false },
  "Aksai Chin": { disputers: ["CHN", "IND"], mapSeries: null, displayed: false },
  "Jammu and Kashmir": { disputers: ["IND", "PAK", "CHN"], mapSeries: null, displayed: false },
};

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const globediv = shallowRef(null);
const rotatedToCountry = ref("");

const appStore = useAppStore();

const tentativelySelectedCountrySeries = computed(() => {
  if (!appStore.globe.tentativelySelectedCountry) {
    return null;
  };
  // If the corresponding feature of the countrySeries has the state 'hover', then start from the midPoint color
  // before any colour animation up to imperialSeaGlass.
  // Otherwise, start from blue.
  const tentativeSelectionIsHovered = selectableCountriesSeries.getDataItemById(appStore.globe.tentativelySelectedCountry)?.get("mapPolygon").isHover();
  const startingColor = tentativeSelectionIsHovered ? hoverLandColour : fill;
  return am5map.MapPolygonSeries.new(root, {
    geoJSON: WHONationalBorders.features.find(f => f.id === appStore.globe.tentativelySelectedCountry),
    reverseGeodata: false,
    fill: startingColor,
    layer: maxZindex - 3,
  });
});

// If the user has any text selected, this plays havoc with any ensuing attempts to drag the globe
// around. So when they restart dragging, we should unselect any selections for them.
const deselectText = () => {
  window.getSelection()?.removeAllRanges();
};

// If the user is dragging the globe around, they may accidentally select text on the page.
const avoidSelectingText = throttle((event) => {
  const primaryMouseButtonIsDown = (event.buttons === 1);
  if (primaryMouseButtonIsDown) {
    deselectText();
  };
}, 25);

const applyGlobeSettings = () => {
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

const animateSeriesColour = (series: am5map.MapPolygonSeries, colour: am5.Color) => {
  series.animate({
    key: "fill",
    to: colour,
    duration: geoPointZoomDuration,
    easing,
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

const rotateToCentroid = (centroid: am5.IGeoPoint, countryIso: string) => {
  return new Promise<void>((resolve) => {
    pauseAnimations();
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
      rotatedToCountry.value = countryIso;
      resolve();
    }, rotateDuration);
  });
};

const countryCentroid = (countryIso: string) => {
  const geometry = WHONationalBorders.features.find(f => f.id === countryIso)?.geometry as MultiPolygon;
  if (geometry) {
    return am5map.getGeoCentroid(geometry);
  }
};

const rotateToCountry = async (countryIso: string) => {
  const centroid = countryCentroid(countryIso);
  if (chart && centroid && rotatedToCountry.value !== countryIso) {
    pauseAnimations();
    await rotateToCentroid(centroid, countryIso);
  }
};

const zoomToCountry = (countryIso: string) => {
  const centroid = countryCentroid(countryIso);
  const geometry = WHONationalBorders.features.find(f => f.id === countryIso)?.geometry as MultiPolygon;
  const bounds = am5map.getGeoBounds(geometry);
  // Don't zoom in very tightly on the country's bounds.
  // Also avoid exceeding the globe's bounds.
  bounds.left = Math.max(-180, bounds.left -= 10);
  bounds.right = Math.min(180, bounds.right += 10);
  bounds.top = Math.min(90, bounds.top += 10);
  bounds.bottom = Math.max(-90, bounds.bottom -= 10);
  if (chart && centroid) {
    pauseAnimations();
    chart.zoomToGeoBounds(bounds, geoPointZoomDuration);
  }
};

// Reset the globe to slowly spinning.
const createRotateAnimation = () => {
  // Initialize map on SE Asia by default
  const currentRotationX = chart.get("rotationX") || southEastAsiaXCoordinate;
  return chart.animate({
    key: "rotationX",
    from: currentRotationX,
    to: 360 - currentRotationX,
    duration: 180000,
    loops: Infinity,
  });
};

watch(() => globediv.value, async (globediv) => {
  if (globediv !== null && !root) {
    root = am5.Root.new(globediv);
    root.setThemes([
      am5themes_Animated.new(root),
    ]);
    chart = root.container.children.push(am5map.MapChart.new(root, chartDefaultSettings));

    backgroundSeries = am5map.MapPolygonSeries.new(root, { geoJSON: WHONationalBorders, fill, reverseGeodata: true, layer: maxZindex - 5 });
    backgroundSeries.mapPolygons.template.setAll({ tooltipText: "{name} is not available", toggleKey: "active", interactive: true });
    backgroundSeries.mapPolygons.template.on("active", (_active, target) => {
      if (prevBackgroundPolygon && prevBackgroundPolygon !== target) {
        prevBackgroundPolygon.set("active", false);
      }
      prevBackgroundPolygon = target;
    });
    chart.series.push(backgroundSeries);

    selectableCountriesSeries = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHONationalBorders,
      fill,
      reverseGeodata: false,
      include: appStore.globeParameter?.options?.map(option => option.id),
      layer: maxZindex - 4,
    });
    selectableCountriesSeries.mapPolygons.template.setAll({ tooltipText: "{name}", toggleKey: "active", interactive: true, cursorOverStyle: "pointer" });
    selectableCountriesSeries.mapPolygons.template.on("active", (_active, target) => {
      if (prevPolygon && prevPolygon !== target) {
        prevPolygon.set("active", false);
        animateSeriesColour(selectableCountriesSeries, fill);
      }
      if (target?.dataItem?.get("id")) {
        appStore.globe.tentativelySelectedCountry = target.dataItem.get("id") as string;
      }
      prevPolygon = target;
    });
    selectableCountriesSeries.mapPolygons.template.states.create("hover", {
      fill: hoverLandColour,
    });
    selectableCountriesSeries.events.on("datavalidated", async () => {
      if (appStore.selectedCountry && !appStore.globe.tentativelySelectedCountry) {
        appStore.globe.tentativelySelectedCountry = appStore.selectedCountry;
        await rotateToCountry(appStore.selectedCountry);
        zoomToCountry(appStore.selectedCountry);
      }
    });
    chart.series.push(selectableCountriesSeries);

    Object.keys(disputedLands).forEach((disputedArea) => {
      const disputedLandSeries = am5map.MapPolygonSeries.new(root, {
        geoJSON: WHODisputedAreas,
        fill,
        reverseGeodata: true,
        include: [disputedArea],
        layer: maxZindex - 1, // Make sure disputed areas are always painted on top of country areas
      });
      disputedLands[disputedArea].mapSeries = disputedLandSeries;
      chart.series.push(disputedLandSeries);
    });

    disputedBodiesOfWater = am5map.MapPolygonSeries.new(root, {
      geoJSON: WHODisputedAreas,
      fill: lightGreyBackground,
      reverseGeodata: true,
      exclude: Object.keys(disputedLands),
      layer: maxZindex, // Make sure lakes are always on top of land
    });
    chart.series.push(disputedBodiesOfWater);

    gentleRotateAnimation = createRotateAnimation();
    applyGlobeSettings();
  }
});

const stopDisplayingAllDisputedAreas = () => {
  Object.keys(disputedLands).forEach((disputedArea) => {
    if (disputedLands[disputedArea].displayed && disputedLands[disputedArea].mapSeries) {
      disputedLands[disputedArea].displayed = false;
      animateSeriesColour(disputedLands[disputedArea].mapSeries!, fill);
    }
  });
};

// Return all disputed areas that a country is involved in.
const disputedAreas = (countryId: string) => {
  return Object.keys(disputedLands).filter((disputedArea) => {
    return disputedLands[disputedArea].disputers.includes(countryId);
  });
};

const resetGlobeZoomAndAnimation = () => {
  if (chart) {
    pauseAnimations();
    // Probably the user has navigated back to the home page.
    chart.goHome(goHomeDuration);
    // Reset the globe to zoomed out and slowly spinning.
    rotatedToCountry.value = "";
    // TODO: Make more memory efficient by not re-creating the animations every time
    gentleRotateAnimation = createRotateAnimation();
    graduallyResetYAxis = chart.animate({ key: "rotationY", to: 0, duration: 20000, easing });
  }
};

const route = useRoute();

const focusTentativelySelectedCountry = async () => {
  if (appStore.globe.tentativelySelectedCountry && tentativelySelectedCountrySeries.value) {
    pauseAnimations();
    chart.series.push(tentativelySelectedCountrySeries.value);

    disputedAreas(appStore.globe.tentativelySelectedCountry!).forEach((disputedArea) => {
      disputedLands[disputedArea].displayed = true;
      animateSeriesColour(disputedLands[disputedArea].mapSeries!, hoverLandColour);
    });
    animateSeriesColour(tentativelySelectedCountrySeries.value, activeCountryColor);

    if (route.path === "/scenarios/new") {
      await rotateToCountry(appStore.globe.tentativelySelectedCountry);
    }
  }
};

// When a country is tentatively selected in the form, re-colour the country area and rotate the globe to it.
watch(() => tentativelySelectedCountrySeries.value, async (newSeries, oldSeries) => {
  if (!chart) {
    return;
  }
  if (prevPolygon) {
    prevPolygon.set("active", false);
  }
  if (!appStore.globe.tentativelySelectedCountry) {
    resetGlobeZoomAndAnimation();
  }
  if (oldSeries) {
    stopDisplayingAllDisputedAreas();
    animateSeriesColour(oldSeries, fill);
    setTimeout(() => {
      removeSeries(oldSeries);
    }, geoPointZoomDuration);
  }
  if (newSeries) {
    await focusTentativelySelectedCountry();
  }
});

// When a country selection is actually submitted in a form (or a user navigates to
// a results page for a different country), then go to that country, rotating if necessary.
watch(() => appStore.selectedCountry, async () => {
  if (appStore.selectedCountry && chart) {
    const centroid = countryCentroid(appStore.selectedCountry);
    if (centroid) {
      await rotateToCountry(appStore.selectedCountry);
      zoomToCountry(appStore.selectedCountry);
    }
  }
});

const globeClass = computed(() => `globe ${appStore.largeScreen ? "large-screen" : ""} ${appStore.globe.interactive ? "interactive" : ""}`);

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
    z-index: -1; // Results in the globe being behind elements and thus does not receive clicks / touches.
  }

  &.large-screen {
    top: $app-header-height;
    left: $sidebar-narrow-width;
  }
}
</style>
