<template>
  <div
    @mousedown="deselectText"
    @touchstart="deselectText"
    @mousemove="onMouseMove"
  >
    <div
      ref="globediv"
      class="globe"
      :class="[(appStore.globe.interactive ? 'interactive' : null)]"
    />
  </div>
</template>

<script lang="ts" setup>
import type { MultiPolygon } from "geojson";
import WHONationalBorders from "@/assets/geodata/2pc_downsampled_WHO_adm0_22102024";
import WHODisputedAreas from "@/assets/geodata/2pc_downsampled_WHO_disputed_areas_22102024";
import { amountToTiltTheEarthUpwardsBy, animateSeriesColourChange, type Animation, createRotateAnimation, geoPointZoomDuration, getWideGeoBounds, handlePolygonActive, initializeSeries, pauseAnimations, removeSeries, rotateToCentroid, southEastAsiaXCoordinate } from "@/components/utils/globe";
import { rgba2hex } from "@amcharts/amcharts5/.internal/core/util/Color";
import * as am5 from "@amcharts/amcharts5/index";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import worldLow from "@amcharts/amcharts5-geodata/worldLow";
import throttle from "lodash.throttle";

const appStore = useAppStore();
const route = useRoute();

// Rename features so that they have the names used in the model package, e.g.
// call it 'Turkey' rather than 'Türkiye', 'Russia' rather than 'Russian Federation'
WHONationalBorders.features = WHONationalBorders.features.map((feature) => {
  const modelCountryName = appStore.globeParameter?.options?.find(o => o.id === feature.id)?.label;
  feature.properties.name = modelCountryName || feature.properties.name;
  return feature;
});

const activeCountryColor = am5.color("#379f9f"); // Imperial sea-glass
const defaultLandColour = am5.color("#002e4e"); // A default land colour: dark blue
const unselectableLandColor = am5.color("#19425e"); // Color for land with missing data
const unselectableLandBoundaryColor = am5.color("#002e4e"); // Color for stroke of the missing data
const hoverLandColour = am5.color("#1c6777"); // The midpoint between defaultLandColour and activeCountryColor
const lightGreyBackground = am5.color(rgba2hex("rgb(243, 244, 247)"));
const maxZindex = 29; // 30 is reserved by amCharts

const goHomeDuration = 500;
let gentleRotateAnimation: Animation;
let graduallyResetYAxis: Animation;
let animations: Animation[] = [];

let root: am5.Root;
let chart: am5map.MapChart;
let selectableCountriesSeries: am5map.MapPolygonSeries;
let backgroundSeries: am5map.MapPolygonSeries;

const disputedLands: Record<string, {
  disputers: string[]
  mapSeries: am5map.MapPolygonSeries | null
  displayed: boolean
  colorAsSelectable: boolean
}> = {
  "Western Sahara": { disputers: ["ESH", "MAR"], mapSeries: null, displayed: false, colorAsSelectable: false },
  "Abyei": { disputers: ["SSD", "SDN"], mapSeries: null, displayed: false, colorAsSelectable: false },
  "Aksai Chin": { disputers: ["CHN", "IND"], mapSeries: null, displayed: false, colorAsSelectable: true },
  "Jammu and Kashmir": { disputers: ["IND", "PAK", "CHN"], mapSeries: null, displayed: false, colorAsSelectable: true },
};
const chartDefaultSettings: am5map.IMapChartSettings = {
  panX: "rotateX",
  panY: "rotateY",
  projection: am5map.geoOrthographic(),
  paddingBottom: 20,
  paddingTop: 20,
  paddingLeft: 20,
  paddingRight: 20,
  pinchZoom: false,
  wheelX: "none",
  wheelY: "none",
  rotationX: southEastAsiaXCoordinate, // Initialize map on SE Asia
  rotationY: -amountToTiltTheEarthUpwardsBy,
};
// Shared settings for countries.
const countrySeriesSettings: am5map.IMapPolygonSeriesSettings = {
  geoJSON: WHONationalBorders,
};
// Settings for the 'background' world map, a map that includes all countries regardless
// of whether they are supported in the model. These are the majority of the world's countries
// and are not able to be selected.
const backgroundSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...countrySeriesSettings,
  fill: unselectableLandColor,
  stroke: unselectableLandBoundaryColor,
  layer: maxZindex - 5,
};
const selectableCountriesSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...countrySeriesSettings,
  fill: defaultLandColour,
  include: appStore.globeParameter?.options?.map(option => option.id),
  layer: maxZindex - 4,
};
// Settings for whatever country the user has selected in the form (but might not have submitted yet).
const highlightedCountrySeriesSettings: am5map.IMapPolygonSeriesSettings = {
  layer: maxZindex - 3,
};
// Shared settings for disputed areas.
const disputedAreaSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  geoJSON: WHODisputedAreas,
};
// Settings for disputed *land* areas - see 'Customization' in shapefiles.md
const disputedLandSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...disputedAreaSeriesSettings,
  layer: maxZindex - 1, // Make sure disputed areas are always painted on top of country areas
};
// Settings for disputed *water* areas - see 'Customization' in shapefiles.md
const disputedBodiesOfWaterSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...disputedAreaSeriesSettings,
  fill: lightGreyBackground,
  exclude: Object.keys(disputedLands),
  layer: maxZindex, // Make sure lakes are always on top of land
};

// You cannot use `ref` with amCharts objects. Instead, you must use `shallowRef`. https://www.amcharts.com/docs/v5/getting-started/integrations/vue/#Important_note
const globediv = shallowRef(null);
// Track the currently rotated to country, to avoid trying to rotate to where we already are.
const rotatedToCountry = ref("");
const prevBackgroundPolygon = ref<am5map.MapPolygon | undefined>(undefined);
const prevSelectablePolygon = ref<am5map.MapPolygon | undefined>(undefined);

const findFeatureForCountry = (countryIso: string) => WHONationalBorders.features.find(f => f.id === countryIso);

const highlightedCountrySeries = computed(() => {
  if (!appStore.globe.highlightedCountry) {
    return null;
  };
  // If the corresponding feature of the countrySeries has the state 'hover', then start from the midPoint color
  // before any colour animation up to imperialSeaGlass.
  // Otherwise, start from blue.
  const highlightIsHovered = selectableCountriesSeries.getDataItemById(appStore.globe.highlightedCountry)?.get("mapPolygon").isHover();
  const startingColor = highlightIsHovered ? hoverLandColour : defaultLandColour;
  return am5map.MapPolygonSeries.new(root, {
    ...highlightedCountrySeriesSettings,
    geoJSON: findFeatureForCountry(appStore.globe.highlightedCountry),
    fill: startingColor,
  });
});

// If the user has any text selected, this plays havoc with any ensuing attempts to drag the globe
// around. So when they restart dragging, we should unselect any selections for them.
const deselectText = () => {
  window.getSelection()?.removeAllRanges();
};

const onMouseMove = throttle((event) => {
  const primaryMouseButtonIsDown = (event.buttons === 1);
  if (primaryMouseButtonIsDown) {
    // If the user is dragging the globe around, they may accidentally select text on the page.
    deselectText();
    // Reset rotatedToCountry when user rotates globe manually
    rotatedToCountry.value = "";
  }
}, 25);

const applyGlobeSettings = () => {
  if (!appStore.globe.interactive && !gentleRotateAnimation.stopped) {
    gentleRotateAnimation.pause();
  }
};

const countryCentroid = (countryIso: string) => {
  const geometry = findFeatureForCountry(countryIso)?.geometry as MultiPolygon;
  if (geometry) {
    return am5map.getGeoCentroid(geometry);
  }
};

const rotateToCountry = async (countryIso: string) => {
  const centroid = countryCentroid(countryIso);
  if (chart && centroid && rotatedToCountry.value !== countryIso) {
    pauseAnimations(animations);
    await rotateToCentroid(chart, centroid, countryIso, rotatedToCountry);
  }
};

const zoomToCountry = (countryIso: string) => {
  const centroid = countryCentroid(countryIso);
  const geometry = findFeatureForCountry(countryIso)?.geometry as MultiPolygon;
  if (chart && centroid) {
    pauseAnimations(animations);
    chart.zoomToGeoBounds(getWideGeoBounds(geometry), geoPointZoomDuration);
  }
};

const setUpBackgroundSeries = () => {
  backgroundSeries = initializeSeries(root, chart, { ...backgroundSeriesSettings });
  backgroundSeries.mapPolygons.template.setAll({ tooltipText: "{name} is not currently available", toggleKey: "active", interactive: true });
  backgroundSeries.mapPolygons.template.on("active", (_active, target) => handlePolygonActive(target, prevBackgroundPolygon));
};

const setUpAntarcticaSeries = () => {
  initializeSeries(root, chart, { ...backgroundSeriesSettings, geoJSON: worldLow, include: ["AQ"] });
};

const setUpSelectableCountriesSeries = () => {
  selectableCountriesSeries = initializeSeries(root, chart, { ...selectableCountriesSeriesSettings });
  selectableCountriesSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",
    toggleKey: "active",
    interactive: true,
    cursorOverStyle: "pointer",
  });
  // When a selectable country is clicked ('active' in amCharts parlance), update the colour, and let
  // the Globe component know the highlighted country has changed.
  selectableCountriesSeries.mapPolygons.template.on("active", (_active, target) => {
    handlePolygonActive(target, prevSelectablePolygon);
    if (prevSelectablePolygon.value && prevSelectablePolygon.value !== target) {
      animateSeriesColourChange(selectableCountriesSeries, defaultLandColour);
    }
    if (target?.dataItem?.get("id")) {
      appStore.globe.highlightedCountry = target.dataItem.get("id") as string;
    }
  });
  selectableCountriesSeries.mapPolygons.template.states.create("hover", { fill: hoverLandColour });

  // Wait for the series' 'datavalidated' event in order for us to be able to use 'getDataItemById';
  // otherwise, when we try to operate on them so soon after creating the series, the dataItems will
  // exist, but not yet have properties we rely on (specifically, an id).
  selectableCountriesSeries.events.on("datavalidated", async () => {
    // On the results page, focus the globe on the scenario country.
    if (appStore.scenarioCountry) {
      appStore.globe.highlightedCountry = appStore.scenarioCountry;
      await rotateToCountry(appStore.scenarioCountry);
      zoomToCountry(appStore.scenarioCountry);
    }
  });
};

const setUpDisputedAreasSeries = () => {
  Object.keys(disputedLands).forEach((disputedArea) => {
    disputedLands[disputedArea].mapSeries = initializeSeries(root, chart, {
      ...disputedLandSeriesSettings,
      include: [disputedArea],
      fill: disputedLands[disputedArea].colorAsSelectable ? defaultLandColour : unselectableLandColor,
    });
  });

  initializeSeries(root, chart, { ...disputedBodiesOfWaterSeriesSettings });
};

const setUpChart = () => {
  root = am5.Root.new(globediv.value);
  root.setThemes([am5themes_Animated.new(root)]);
  chart = root.container.children.push(am5map.MapChart.new(root, chartDefaultSettings));
  setUpBackgroundSeries();
  setUpAntarcticaSeries();
  setUpSelectableCountriesSeries();
  setUpDisputedAreasSeries();
  gentleRotateAnimation = createRotateAnimation(chart);
  applyGlobeSettings();
};

watch(() => globediv.value, async (globediv) => {
  if (globediv !== null && !root) {
    setUpChart();
  }
});

const stopDisplayingAllDisputedAreas = () => {
  Object.keys(disputedLands).forEach((disputedArea) => {
    if (disputedLands[disputedArea].displayed && disputedLands[disputedArea].mapSeries) {
      disputedLands[disputedArea].displayed = false;
      animateSeriesColourChange(disputedLands[disputedArea].mapSeries!, defaultLandColour);
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
    pauseAnimations(animations);
    // Probably the user has navigated back to the home page.
    chart.goHome(goHomeDuration);
    // Reset the globe to zoomed out and slowly spinning.
    rotatedToCountry.value = "";
    // TODO: Make more memory efficient by not re-creating the animations every time
    gentleRotateAnimation = createRotateAnimation(chart);
    if (graduallyResetYAxis) {
      graduallyResetYAxis.play();
    } else {
      graduallyResetYAxis = chart.animate({ key: "rotationY", to: 0, duration: 20000, easing: am5.ease.inOut(am5.ease.cubic) });
    }
    animations = [gentleRotateAnimation, graduallyResetYAxis];
  }
};

// When a country is selected (by form or globe), re-colour the country area, and, if we are
// on the new scenario page, rotate the globe to focus on that country.
const highlightCountry = async () => {
  if (appStore.globe.highlightedCountry && highlightedCountrySeries.value) {
    pauseAnimations(animations);
    chart.series.push(highlightedCountrySeries.value);

    disputedAreas(appStore.globe.highlightedCountry!).forEach((disputedArea) => {
      disputedLands[disputedArea].displayed = true;
      animateSeriesColourChange(disputedLands[disputedArea].mapSeries!, hoverLandColour);
    });
    animateSeriesColourChange(highlightedCountrySeries.value, activeCountryColor);

    // Only rotate if we are on the new scenario page - on other pages this can be distracting.
    if (route.path === "/scenarios/new") {
      await rotateToCountry(appStore.globe.highlightedCountry);
    }
  }
};

watch(() => highlightedCountrySeries.value, async (newSeries, oldSeries) => {
  if (chart) {
    prevSelectablePolygon.value?.set("active", false);
    if (!appStore.globe.highlightedCountry) {
      resetGlobeZoomAndAnimation();
    }
    if (oldSeries) {
      stopDisplayingAllDisputedAreas();
      animateSeriesColourChange(oldSeries, defaultLandColour);
      setTimeout(() => {
        removeSeries(chart, oldSeries);
      }, geoPointZoomDuration);
    }
    if (newSeries) {
      await highlightCountry();
    }
  }
});

// When a country selection is actually submitted in a form (or a user navigates to
// a results page for a different country), then go to that country, rotating if necessary.
watch(() => appStore.scenarioCountry, async () => {
  if (appStore.scenarioCountry && chart) {
    const centroid = countryCentroid(appStore.scenarioCountry);
    if (centroid) {
      await rotateToCountry(appStore.scenarioCountry);
      zoomToCountry(appStore.scenarioCountry);
    }
  }
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
  top: $app-header-height;
  left: $sidebar-narrow-width;
  position: absolute; // TODO: make the globe stay still when you scroll down the results page

  transition: filter 1s ease;
  &:not(.interactive) {
    filter: opacity(20%);
    z-index: -1; // Results in the globe being behind elements and thus does not receive clicks / touches.
  }
}
</style>
