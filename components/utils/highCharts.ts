import { abbreviateMillionsDollars } from "#imports";
import hexRgb from "hex-rgb";
import Highcharts from "highcharts/esm/highcharts";
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "./formatters";
import { CostBasis } from "~/types/unitTypes";

const originalHighchartsColors = Highcharts.getOptions().colors!;
const colorRgba = hexRgb(originalHighchartsColors[0] as string);
colorRgba.alpha = 0.3;
export const plotBandsColor = `rgba(${Object.values(colorRgba).join(",")})`;
export const plotLinesColor = "#FF0000"; // red;
export const timeSeriesColors = originalHighchartsColors!.slice(1);

// Colours from Bang Wong palette, see https://davidmathlogic.com/colorblind
export const colorBlindSafeColors = [
  { name: "Vermillion", hex: "#d55e00" },
  { name: "Bluish green", hex: "#009e73" },
  { name: "Sky blue", hex: "#56b4e9" },
];

// Create a range of N colors varying in brightness
// NB This won't work well with colors that are already very light or very dark.
export const getColorVariants = (colorHex: string, numberOfVariants: number) => {
  const rgb = hexRgb(colorHex);
  const colors = [];
  const minBrightness = 0.75; // 75% brightness
  const maxBrightness = 1.25; // 125% brightness
  for (let i = 0; i < numberOfVariants; i++) {
    const factor = i / (numberOfVariants - 1);
    const brightness = minBrightness + (maxBrightness - minBrightness) * factor;
    let r = Math.round(rgb.red * brightness);
    let g = Math.round(rgb.green * brightness);
    let b = Math.round(rgb.blue * brightness);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    const newColor = `rgba(${r},${g},${b},${rgb.alpha})`;
    colors.push(newColor);
  }
  return colors.reverse();
};

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
  point?: Highcharts.Point & { custom: { includeInTooltips: boolean }, y: number }
  total: number
  y: number
}

const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis) => {
  let valueDisplay;
  if (costBasis === CostBasis.PercentGDP) {
    valueDisplay = `${humanReadablePercentOfGdp(point.y).percent}%`;
  } else {
    const abbr = abbreviateMillionsDollars(point.y || 0, 1, true);
    valueDisplay = `$${abbr.amount} ${abbr.unit}`;
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}<span style="font-size: 0.9rem;">: <b>${valueDisplay}</b>`
    + `</span></span><br/>`;
};

// Tooltip text for a stacked column (shared tooltip for all points in the stack)
export const costsChartTooltipText = (context: unknown, costBasis: CostBasis, nationalGdp: number) => {
  const tooltipPointInstance = context as TooltipPointInstance;

  let headerText = `${tooltipPointInstance.point?.category} losses: `;
  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(tooltipPointInstance.total);
    headerText = `${headerText}<b>${percentOfGdp.percent}%</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(tooltipPointInstance.total, 1);
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

// Labels for (stacked) columns
export const costsChartStackLabelFormatter = (value: number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value.toFixed(1)}% of GDP`;
  } else if (costBasis === CostBasis.USD) {
    const abbr = expressMillionsDollarsAsBillions(value, 1);
    return `$${abbr.amount} ${abbr.unit}`;
  }
};

// Labels for yAxis ticks
export const costsChartLabelFormatter = (value: string | number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value}%`;
  } else if (costBasis === CostBasis.USD) {
    return Object.values(expressMillionsDollarsAsBillions(value as number, 0, true)).join(" ");
  }
};
