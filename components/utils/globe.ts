import * as am5 from "@amcharts/amcharts5/index";
import * as am5map from "@amcharts/amcharts5/map";

// To place any country of interest on the 'upper-facing' part of the globe. Just looks better.
const rotateDuration = 2000;
export const amountToTiltTheEarthUpwardsBy = 25;
export const geoPointZoomDuration = 2000;
export const southEastAsiaXCoordinate = -100;

export interface Animation { pause: () => void, stopped: boolean, play: () => void }

const pauseAnimation = (animation: Animation) => {
  if (animation && !animation.stopped) {
    animation.pause();
  }
};

export const pauseAnimations = (animations: Animation[]) => {
  animations.forEach((animation: Animation) => pauseAnimation(animation));
};

const rotateChart = (chart: am5map.MapChart, direction: "x" | "y", to: number) => {
  if (direction === "x") {
    const currentXRotation = chart.get("rotationX")!;
    // calculates the smallest rotation between 0 amd 360 to get to the country
    let diffRotation = (to - currentXRotation) % 360;
    // translates rotation to between -180 and 180 because rotating 270 east
    // is the same as 90 west
    if (diffRotation > 180) {
      diffRotation = diffRotation - 360;
    }
    // gets actual rotation destination by adding the difference
    const toShortest = currentXRotation + diffRotation;
    chart.animate({
      key: "rotationX",
      to: toShortest,
      duration: rotateDuration,
      easing: am5.ease.inOut(am5.ease.cubic),
    });
  } else {
    chart.animate({
      key: "rotationY",
      to,
      duration: rotateDuration,
      easing: am5.ease.inOut(am5.ease.cubic),
    });
  }
};

export const rotateToCentroid = (chart: am5map.MapChart, centroid: am5.IGeoPoint, countryIso: string, rotatedToCountryRef: Ref<string>) => {
  return new Promise<void>((resolve) => {
    rotateChart(chart, "x", -centroid.longitude);
    rotateChart(chart, "y", (amountToTiltTheEarthUpwardsBy - centroid.latitude));
    setTimeout(() => {
      rotatedToCountryRef.value = countryIso;
      resolve();
    }, rotateDuration);
  });
};

export const initializeSeries = (root: am5.Root, chart: am5map.MapChart, settings: am5map.IMapPolygonSeriesSettings) => {
  const series = am5map.MapPolygonSeries.new(root, settings);
  chart.series.push(series);
  return series;
};

// https://www.amcharts.com/docs/v4/tutorials/dynamically-adding-and-removing-series/
export const removeSeries = (chart: am5map.MapChart, seriesToRemove: am5map.MapPolygonSeries) => {
  chart.series.removeIndex(
    chart.series.indexOf(seriesToRemove),
  ).dispose();
};

export const animateSeriesColourChange = (
  series: am5map.MapPolygonSeries,
  colour: am5.Color,
) => series.animate({ key: "fill", to: colour, duration: geoPointZoomDuration, easing: am5.ease.inOut(am5.ease.cubic) });

// Reset the globe to slowly spinning.
export const createRotateAnimation = (chart: am5map.MapChart) => {
  let currentRotationX: number;
  if (chart.get("rotationX") === 0) {
    currentRotationX = 0;
  } else {
    currentRotationX = chart.get("rotationX") || southEastAsiaXCoordinate;
  }
  return chart.animate({
    key: "rotationX",
    from: currentRotationX,
    to: 360 + currentRotationX,
    duration: 180000,
    loops: Infinity,
  });
};

// When a polygon is activated (clicked), make sure the previously activated polygon is deactivated.
export const handlePolygonActive = (target: am5map.MapPolygon, prevPolygonRef: Ref<am5map.MapPolygon | undefined>) => {
  if (prevPolygonRef.value && prevPolygonRef.value !== target) {
    prevPolygonRef.value.set("active", false);
  }
  prevPolygonRef.value = target;
};

// Given a country's geometry, return bounds for the country, for zooming in to.
export const getWideGeoBounds = (geometry: GeoJSON.GeometryObject) => {
  // Add padding to bounds to avoid zooming in very tightly on the country's bounds.
  const padding = 10;
  const bounds = am5map.getGeoBounds(geometry);
  // Avoid exceeding the globe's bounds (-180/180/90/-90).
  bounds.left = Math.max(-180, bounds.left -= padding);
  bounds.right = Math.min(180, bounds.right += padding);
  bounds.top = Math.min(90, bounds.top += padding);
  bounds.bottom = Math.max(-90, bounds.bottom -= padding);
  return bounds;
};
