import convert, { type HSL } from "color-convert";

export interface colorRgbHsl {
  name: string
  rgb: string
  hsl: HSL
}

// Colours from Bang Wong palette, see https://davidmathlogic.com/colorblind
// RGB values derived from the Wong 2011 source https://www.nature.com/articles/nmeth.1618
export const colorBlindSafeSmallPalette: colorRgbHsl[] = [
  { name: "Vermillion", rgb: "rgb(213,94,0)", hsl: convert.rgb.hsl(213, 94, 0) }, // hsl: [26, 100, 42]
  { name: "Bluish green", rgb: "rgb(0,158,115)", hsl: convert.rgb.hsl(0, 158, 115) }, // hsl: [164, 100, 31]
  { name: "Sky blue", rgb: "rgb(86,180,233)", hsl: convert.rgb.hsl(86, 180, 233) }, // hsl: [202, 77, 63]
];

// Two possible larger colour palettes, intended for charts that need more colours.
// Palettes from Paul Tol, see https://davidmathlogic.com/colorblind
// Archived Paul Tol site: https://web.archive.org/web/20250109045745/https://personal.sron.nl/~pault/#sec:qualitative
const brightColors: colorRgbHsl[] = [
  { name: "Purple", rgb: "rgb(170,51,119)", hsl: convert.rgb.hsl(170, 51, 119) },
  { name: "Yellow", rgb: "rgb(204,187,68)", hsl: convert.rgb.hsl(204, 187, 68) },
  { name: "Blue", rgb: "rgb(68,119,170)", hsl: convert.rgb.hsl(68, 119, 170) },
  { name: "Cyan", rgb: "rgb(102,204,238)", hsl: convert.rgb.hsl(102, 204, 238) },
  { name: "Green", rgb: "rgb(34,136,51)", hsl: convert.rgb.hsl(34, 136, 51) },
  { name: "Red", rgb: "rgb(238,102,119)", hsl: convert.rgb.hsl(238, 102, 119) },
];

const vibrantColors: colorRgbHsl[] = [
  { name: "Purple", rgb: "rgb(238,51,119)", hsl: convert.rgb.hsl(238, 51, 119) },
  { name: "Yellow", rgb: "rgb(238,119,51)", hsl: convert.rgb.hsl(238, 119, 51) },
  { name: "Blue", rgb: "rgb(0,119,187)", hsl: convert.rgb.hsl(0, 119, 187) },
  { name: "Cyan", rgb: "rgb(51,187,238)", hsl: convert.rgb.hsl(51, 187, 238) },
  { name: "Green", rgb: "rgb(0,153,136)", hsl: convert.rgb.hsl(0, 153, 136) },
  { name: "Red", rgb: "rgb(204,51,17)", hsl: convert.rgb.hsl(204, 51, 17) },
];

const doVibrantColors = true; // Set to true to use vibrant colors instead of bright ones

export const colorBlindSafeLargePalette = [
  ...(doVibrantColors ? vibrantColors : brightColors),
  { name: "Black", rgb: "rgb(0,0,0)", hsl: convert.rgb.hsl(0, 0, 0) },
];

// Create a range of color variants varying in lightness (L) and saturation (S) channels.
// These channels have configurable ranges of factors used to multiply the original L/S.
// Does not alter hue (H), in order to maintain color-blind safeness.
// It's recommended to prefer only *increases* to saturation, since low saturation looks dull.
export const getColorVariants = (
  color: colorRgbHsl,
  numberOfVariants: number,
  LFactorRange: { from: number, to: number } = { from: 0.75, to: 1.25 },
  SFactorRange: { from: number, to: number } = { from: 1, to: 1.25 }, // NB only one color does not already have maximum saturation.
  opacity: number = 1,
): string[] =>
  Array.from({ length: numberOfVariants }, (_, i) => {
    // Get the next equidistant factor in the range
    const LFactor = LFactorRange.from + (LFactorRange.to - LFactorRange.from) * (i / (numberOfVariants - 1));
    const originalL = color.hsl[2];
    const newLightness = Math.max(0, Math.min(100, originalL * LFactor));

    const SFactor = SFactorRange.from + (SFactorRange.to - SFactorRange.from) * (i / (numberOfVariants - 1));
    const originalS = color.hsl[1];
    const newSaturation = Math.max(0, Math.min(100, originalS * SFactor));

    const newHsl: HSL = [color.hsl[0], newSaturation, newLightness];
    const rgb = convert.hsl.rgb(newHsl);
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
  }).reverse();

export interface LegendItem {
  color: string
  label: string
  shape: string
}

export enum LegendShape {
  Rectangle = "rectangle",
  Line = "line",
  Circle = "circle",
  SquareDash = "squareDash",
}

export const contextButtonOptions = {
  height: 20,
  width: 22,
  symbolSize: 12,
  symbolY: 10,
  symbolX: 12,
  symbolStrokeWidth: 2,
  // Omit 'printChart' and 'viewData' from menu items
  menuItems: ["downloadCSV", "downloadXLS", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG", "separator", "viewFullscreen"],
  useHTML: true,
} as Highcharts.ExportingButtonsOptionsObject;

export const menuItemDefinitionOptions = {
  downloadCSV: {
    text: "Download CSV for this chart",
  },
  downloadXLS: {
    text: "Download XLS for this chart",
  },
} as Highcharts.Dictionary<Highcharts.ExportingMenuObject>;

export const chartBackgroundColorOnExporting = "white";
const chartBackgroundColor = "transparent";
export const chartOptions = {
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
    fontFamily: "ImperialSansText, sans-serif",
  },
} as Highcharts.ChartOptions;

// The TS declarations for the context object aren't correct, so we declare our own interface:
// https://github.com/highcharts/highcharts/issues/22281#issuecomment-2516994341
// The interface appears to be the same as the now defunct Highcharts.TooltipFormatterContextObject class.
export interface TooltipPointInstance extends Highcharts.Point {
  points?: Array<TooltipPointInstance>
  point?: TooltipPointInstance
  total: number
  x: number
  y: number
  custom: {
    includeInTooltips: boolean
    costAsGdpPercent: number
  }
}
