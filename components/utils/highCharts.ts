import convert, { type HSL } from "color-convert";
import { abbreviateMillionsDollars } from "~/utils/money";
import { costAsPercentOfGdp, gdpReferenceYear, humanReadableInteger, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { countryFlagIconId } from "./countryFlag";

export interface colorRgbHsl {
  name: string
  rgb: string
  hsl: HSL
}

// Colours from Paul Tol palette, see https://davidmathlogic.com/colorblind
// Archived Paul Tol site: https://web.archive.org/web/20250109045745/https://personal.sron.nl/~pault/#sec:qualitative
const _brightColors: colorRgbHsl[] = [
  { name: "Purple", rgb: "rgb(170,51,119)", hsl: convert.rgb.hsl(170, 51, 119) },
  { name: "Cyan", rgb: "rgb(102,204,238)", hsl: convert.rgb.hsl(102, 204, 238) },
  { name: "Blue", rgb: "rgb(68,119,170)", hsl: convert.rgb.hsl(68, 119, 170) },
  { name: "Red", rgb: "rgb(238,102,119)", hsl: convert.rgb.hsl(238, 102, 119) },
  { name: "Yellow", rgb: "rgb(204,187,68)", hsl: convert.rgb.hsl(204, 187, 68) },
  { name: "Green", rgb: "rgb(34,136,51)", hsl: convert.rgb.hsl(34, 136, 51) },
];

const vibrantColors: colorRgbHsl[] = [
  { name: "Purple", rgb: "rgb(238,51,119)", hsl: convert.rgb.hsl(238, 51, 119) },
  { name: "Cyan", rgb: "rgb(51,187,238)", hsl: convert.rgb.hsl(51, 187, 238) },
  { name: "Blue", rgb: "rgb(0,119,187)", hsl: convert.rgb.hsl(0, 119, 187) },
  { name: "Red", rgb: "rgb(204,51,17)", hsl: convert.rgb.hsl(204, 51, 17) },
  { name: "Yellow", rgb: "rgb(238,119,51)", hsl: convert.rgb.hsl(238, 119, 51) },
  { name: "Green", rgb: "rgb(0,153,136)", hsl: convert.rgb.hsl(0, 153, 136) },
];

export const colorBlindSafeColors = [...vibrantColors, { name: "Black", rgb: "rgb(0,0,0)", hsl: convert.rgb.hsl(0, 0, 0) }];
export const plotLinesColorName = "Red";
export const plotLinesColor = colorBlindSafeColors.find(c => c.name === plotLinesColorName)!.rgb;
const colorRgbAlpha = 0.3;
export const plotBandsColorName = "Cyan";
export const plotBandsColor = colorBlindSafeColors
  .find(c => c.name === plotBandsColorName)!
  .rgb
  .replace("rgb", "rgba")
  .replace(")", `,${colorRgbAlpha})`);
// Order the colors to privelege those which are least similar to the plot lines color.
const multiScenarioTimeSeriesColorsOrder = ["Cyan", "Green", "Yellow", "Blue", "Purple", "Black", "Red"];
export const multiScenarioTimeSeriesColors = colorBlindSafeColors
  .toSorted((a, b) => {
    const aIndex = multiScenarioTimeSeriesColorsOrder.indexOf(a.name);
    const bIndex = multiScenarioTimeSeriesColorsOrder.indexOf(b.name);
    return aIndex - bIndex;
  })
  .filter(c => c.name !== plotLinesColorName);

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

// 'Category' is the internal name for the x-axis in a multi-scenario costs chart, i.e. it denotes which scenario the column refers to.
export const getScenarioCategoryLabel = (category: string, axisParam: Parameter | undefined): string => {
  if (axisParam?.parameterType === TypeOfParameter.Numeric) {
    return humanReadableInteger(category);
  } else {
    return axisParam?.options?.find(o => o.id === category)?.label || "";
  }
};

// Tooltip text for a stacked column in a multi-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartMultiScenarioStackedTooltip = (context: unknown, costBasis: CostBasis, axisParam: Parameter | undefined) => {
  const contextInstance = context as TooltipPointInstance;
  const point = contextInstance.point;
  if (!point || !axisParam) {
    return;
  }

  let headerText = `${axisParam.label}: <b>${getScenarioCategoryLabel(point.category as string, axisParam)}</b>`;

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

export const costsChartMultiScenarioXAxisLabelFormatter = (category: string, axisParam: Parameter | undefined) => {
  const scenarioLabel = getScenarioCategoryLabel(category, axisParam);

  if (axisParam?.parameterType === TypeOfParameter.GlobeSelect) {
    return `<div class="d-flex gap-2 align-items-center mb-2">
      <span class="fi fi-${countryFlagIconId(category)}" style="width: 1.2rem; height: 1.2rem"></span>
      <span>${scenarioLabel}</span>
    </div>`;
  } else {
    return scenarioLabel;
  }
};

// TODO: Make this depend on a 'units' property in metadata. https://mrc-ide.myjetbrains.com/youtrack/issue/JIDEA-117/
export const timeSeriesYUnits = (seriesGroupId: string): string => {
  switch (seriesGroupId) {
    case "hospitalisations":
      return "in need of hospitalisation";
    case "deaths":
      return "deaths";
    case "vaccinations":
      return "vaccinated";
    default:
      return "cases";
  }
};
