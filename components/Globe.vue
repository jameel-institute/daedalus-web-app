<template>
  <div
    v-show="appStore.globeParameter && appStore.largeScreen"
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
import { rgba2hex } from "@amcharts/amcharts5/.internal/core/util/Color";
import * as am5 from "@amcharts/amcharts5/index";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
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
// Shared settings for countries.
const countrySeriesSettings: am5map.IMapPolygonSeriesSettings = {
  geoJSON: WHONationalBorders,
  fill: defaultLandColour,
};
// Settings for the 'background' world map, a map that includes all countries regardless
// of whether they are supported in the model. These are the majority of the world's countries
// and are not able to be selected.
const backgroundSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...countrySeriesSettings,
  layer: maxZindex - 5,
};
const selectableCountriesSeriesSettings: am5map.IMapPolygonSeriesSettings = {
  ...countrySeriesSettings,
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
  fill: defaultLandColour,
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
const rotatedToCountry = ref("");
const prevBackgroundPolygon = ref<am5map.MapPolygon | undefined>(undefined);
const prevSelectablePolygon = ref<am5map.MapPolygon | undefined>(undefined);

const highlightedCountrySeries = computed(() => {
  if (!appStore.globe.highlightedCountry) {
    return null;
  };
  // If the corresponding feature of the countrySeries has the state 'hover', then start from the midPoint color
  // before any colour animation up to imperialSeaGlass.
  // Otherwise, start from blue.
  const tentativeSelectionIsHovered = selectableCountriesSeries.getDataItemById(appStore.globe.highlightedCountry)?.get("mapPolygon").isHover();
  const startingColor = tentativeSelectionIsHovered ? hoverLandColour : defaultLandColour;
  return am5map.MapPolygonSeries.new(root, {
    ...highlightedCountrySeriesSettings,
    geoJSON: WHONationalBorders.features.find(f => f.id === appStore.globe.highlightedCountry),
    reverseGeodata: false,
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

// https://www.amcharts.com/docs/v4/tutorials/dynamically-adding-and-removing-series/
const removeSeries = (seriesToRemove: am5map.MapPolygonSeries) => {
  chart.series.removeIndex(
    chart.series.indexOf(seriesToRemove),
  ).dispose();
};

const animateSeriesColour = (
  series: am5map.MapPolygonSeries,
  colour: am5.Color,
) => series.animate({ key: "fill", to: colour, duration: geoPointZoomDuration, easing });

const pauseAnimation = (animation: Animation) => {
  if (animation && !animation.stopped) {
    animation.pause();
  }
};

const pauseAnimations = () => {
  pauseAnimation(gentleRotateAnimation);
  pauseAnimation(graduallyResetYAxis);
};

const rotateChart = (direction: "x" | "y", to: number) => {
  chart.animate({
    key: (direction === "x" ? "rotationX" : "rotationY"),
    to,
    duration: rotateDuration,
    easing,
  });
};

const rotateToCentroid = (centroid: am5.IGeoPoint, countryIso: string) => {
  return new Promise<void>((resolve) => {
    pauseAnimations();
    rotateChart("x", -centroid.longitude);
    rotateChart("y", (amountToTiltTheEarthUpwardsBy - centroid.latitude));
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
  const currentRotationX = chart.get("rotationX") || southEastAsiaXCoordinate;
  return chart.animate({
    key: "rotationX",
    from: currentRotationX,
    to: 360 - currentRotationX,
    duration: 180000,
    loops: Infinity,
  });
};

const initializeSeries = (settings: am5map.IMapPolygonSeriesSettings) => {
  const series = am5map.MapPolygonSeries.new(root, settings);
  chart.series.push(series);
  return series;
};

const handlePolygonActive = (target: am5map.MapPolygon, prevPolygonRef: Ref<am5map.MapPolygon | undefined>) => {
  if (prevPolygonRef.value && prevPolygonRef.value !== target) {
    prevPolygonRef.value.set("active", false);
  }
  prevPolygonRef.value = target;
};

const setUpBackgroundSeries = () => {
  backgroundSeries = initializeSeries({ ...backgroundSeriesSettings, reverseGeodata: true });
  backgroundSeries.mapPolygons.template.setAll({ tooltipText: "{name} is not currently available", toggleKey: "active", interactive: true });
  backgroundSeries.mapPolygons.template.on("active", (_active, target) => handlePolygonActive(target, prevBackgroundPolygon));
};

const setUpSelectableCountriesSeries = () => {
  selectableCountriesSeries = initializeSeries({ ...selectableCountriesSeriesSettings, reverseGeodata: false });
  selectableCountriesSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",
    toggleKey: "active",
    interactive: true,
    cursorOverStyle: "pointer",
  });
  selectableCountriesSeries.mapPolygons.template.on("active", (_active, target) => {
    handlePolygonActive(target, prevSelectablePolygon);
    if (prevSelectablePolygon.value && prevSelectablePolygon.value !== target) {
      animateSeriesColour(selectableCountriesSeries, defaultLandColour);
    }
    if (target?.dataItem?.get("id")) {
      appStore.globe.highlightedCountry = target.dataItem.get("id") as string;
    }
  });
  selectableCountriesSeries.mapPolygons.template.states.create("hover", { fill: hoverLandColour });
  selectableCountriesSeries.events.on("datavalidated", async () => {
    if (appStore.scenarioCountry && !appStore.globe.highlightedCountry) {
      appStore.globe.highlightedCountry = appStore.scenarioCountry;
      await rotateToCountry(appStore.scenarioCountry);
      zoomToCountry(appStore.scenarioCountry);
    }
  });
};

const setUpDisputedAreasSeries = () => {
  Object.keys(disputedLands).forEach((disputedArea) => {
    disputedLands[disputedArea].mapSeries = initializeSeries({
      ...disputedLandSeriesSettings,
      reverseGeodata: true,
      include: [disputedArea],
    });
  });

  initializeSeries({ ...disputedBodiesOfWaterSeriesSettings, reverseGeodata: true });
};

const setUpChart = () => {
  root = am5.Root.new(globediv.value);
  root.setThemes([am5themes_Animated.new(root)]);
  chart = root.container.children.push(am5map.MapChart.new(root, chartDefaultSettings));
  setUpBackgroundSeries();
  setUpSelectableCountriesSeries();
  setUpDisputedAreasSeries();
  gentleRotateAnimation = createRotateAnimation();
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
      animateSeriesColour(disputedLands[disputedArea].mapSeries!, defaultLandColour);
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

// When a country is tentatively selected in the form, re-colour the country area and rotate the globe to it.
const focusTentativelySelectedCountry = async () => {
  if (appStore.globe.highlightedCountry && highlightedCountrySeries.value) {
    pauseAnimations();
    chart.series.push(highlightedCountrySeries.value);

    disputedAreas(appStore.globe.highlightedCountry!).forEach((disputedArea) => {
      disputedLands[disputedArea].displayed = true;
      animateSeriesColour(disputedLands[disputedArea].mapSeries!, hoverLandColour);
    });
    animateSeriesColour(highlightedCountrySeries.value, activeCountryColor);

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
      animateSeriesColour(oldSeries, defaultLandColour);
      setTimeout(() => {
        removeSeries(oldSeries);
      }, geoPointZoomDuration);
    }
    if (newSeries) {
      await focusTentativelySelectedCountry();
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
