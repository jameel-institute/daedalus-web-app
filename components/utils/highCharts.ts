import convert, { type HSL } from "color-convert";
import { abbreviateMillionsDollars } from "~/utils/money";
import { costAsPercentOfGdp, gdpReferenceYear, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { countryFlagClass } from "./countryFlag";
import { getScenarioLabel } from "./comparisons";

export interface colorRgbHsl {
  name: string
  rgb: string
  hsl: HSL
}

// Colours from Bang Wong palette, see https://davidmathlogic.com/colorblind
// RGB values derived from the Wong 2011 source https://www.nature.com/articles/nmeth.1618
const colorBlindSafeSmallPalette: colorRgbHsl[] = [
  { name: "Vermillion", rgb: "rgb(213,94,0)", hsl: convert.rgb.hsl(213, 94, 0) }, // hsl: [26, 100, 42]
  { name: "Bluish green", rgb: "rgb(0,158,115)", hsl: convert.rgb.hsl(0, 158, 115) }, // hsl: [164, 100, 31]
  { name: "Sky blue", rgb: "rgb(86,180,233)", hsl: convert.rgb.hsl(86, 180, 233) }, // hsl: [202, 77, 63]
];
export const costsPalette = colorBlindSafeSmallPalette;

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
export const plotLinesColorName = "Red";
export const plotLinesColor = colorBlindSafeLargePalette.find(c => c.name === plotLinesColorName)!.rgb;
export const plotBandsRgbAlpha = 0.3;
export const plotBandsColorName = "Cyan";
export const plotBandsDefaultColor = colorBlindSafeLargePalette.find(c => c.name === plotBandsColorName)!.rgb;
export const addAlphaToRgb = (colorRgb: string, alpha: number): string => {
  return colorRgb.replace("rgb", "rgba").replace(")", `,${alpha})`);
};

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
interface TooltipPointInstance extends Highcharts.Point {
  points?: Array<TooltipPointInstance>
  point?: TooltipPointInstance
  total: number
  y: number
  custom: {
    includeInTooltips: boolean
    costAsGdpPercent: number
  }
}

export const yAxisTitle = (costBasis: CostBasis) => {
  return costBasis === CostBasis.PercentGDP
    ? `Losses as % of ${gdpReferenceYear} national GDP`
    : "Losses in billions USD";
};

const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis) => {
  let valueDisplay;
  if (costBasis === CostBasis.PercentGDP) {
    valueDisplay = `${humanReadablePercentOfGdp(point.y).percent}%`;
  } else {
    const abbr = abbreviateMillionsDollars(point.y || 0, true);
    valueDisplay = `$${abbr.amount} ${abbr.unit}`;
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}<span style="font-size: 0.9rem;">: <b>${valueDisplay}</b>`
    + `</span></span><br/>`;
};

// Tooltip text for a stacked column in a single-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartSingleScenarioTooltip = (context: unknown, costBasis: CostBasis, nationalGdp: number) => {
  const tooltipPointInstance = context as TooltipPointInstance;

  let headerText = `${tooltipPointInstance.point?.category} losses: `;
  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(tooltipPointInstance.total);
    headerText = `${headerText}<b>${percentOfGdp.percent}%</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(tooltipPointInstance.total);
    headerText = `${headerText}<b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b>`;
    if (tooltipPointInstance.total > 0) {
      const percentOfGdp = humanReadablePercentOfGdp(costAsPercentOfGdp(tooltipPointInstance.total, nationalGdp));
      headerText = `${headerText}</br>(${percentOfGdp.percent}% ${percentOfGdp.reference})`;
    }
  }

  const pointsText = tooltipPointInstance.points
    ?.filter(point => point.point?.custom.includeInTooltips)
    .map((point) => {
      return costsChartTooltipPointFormatter(point, costBasis);
    })
    ?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Tooltip text for a stacked column in a multi-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartMultiScenarioStackedTooltip = (context: unknown, costBasis: CostBasis, axisParam: Parameter | undefined) => {
  const contextInstance = context as TooltipPointInstance;
  const point = contextInstance.point;
  if (!point || !axisParam) {
    return;
  }

  let headerText = `${axisParam.label}: <b>${getScenarioLabel(point.category as string, axisParam)}</b>`;

  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(point.total);
    headerText = `${headerText}</br></br>Total losses: <b>${percentOfGdp.percent}%</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(point.total);
    headerText = `${headerText}<br/></br>Total losses: <b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b>`;
    if (point.total > 0) {
      const totalCostAsGdpPercent = point.points?.map(p => p.custom.costAsGdpPercent).reduce((sum, a) => sum + a, 0);
      if (totalCostAsGdpPercent) {
        const percentOfGdp = humanReadablePercentOfGdp(totalCostAsGdpPercent);
        headerText = `${headerText}</br>(${percentOfGdp.percent}% ${percentOfGdp.reference})`;
      }
    }
  }

  const pointsText = point.points?.map(p => costsChartTooltipPointFormatter(p, costBasis))?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Labels for (stacked) columns
export const costsChartStackLabelFormatter = (value: number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value.toFixed(1)}% of GDP`;
  } else if (costBasis === CostBasis.USD) {
    const abbr = abbreviateMillionsDollars(value, false);
    return `$${abbr.amount} ${abbr.unit}`;
  }
};

export const costsChartYAxisTickFormatter = (value: string | number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value}%`;
  } else if (costBasis === CostBasis.USD) {
    return Object.values(expressMillionsDollarsAsBillions(value as number, 0, true)).join(" ");
  }
};

export const costsChartMultiScenarioXAxisLabelFormatter = (
  category: string,
  axisParam: Parameter | undefined,
  baseline: string | undefined,
) => {
  const scenarioLabel = getScenarioLabel(category, axisParam);
  const paramIsCountry = axisParam?.parameterType === TypeOfParameter.GlobeSelect;
  const marginForFlag = paramIsCountry ? "mt-1" : "";
  const scenarioLabelSpan = baseline && category === baseline
    ? `<span class="fw-medium text-primary-emphasis ${marginForFlag}">${scenarioLabel} (baseline)</span>`
    : `<span class="${marginForFlag}">${scenarioLabel}</span>`;

  if (paramIsCountry) {
    return `<div class="d-flex gap-2 align-items-center mb-2">
      <span
        class="${countryFlagClass(category)}"
        style="width: 1rem; height: 0.75rem;"
      ></span>
      ${scenarioLabelSpan}
    </div>`;
  } else {
    return scenarioLabelSpan;
  }
};
