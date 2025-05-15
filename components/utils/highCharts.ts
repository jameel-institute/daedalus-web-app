import { abbreviateMillionsDollars } from "#imports";
import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";
import { humanReadablePercentOfGdp } from "./formatters";

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
export const getColorVariants = (colorHex: string, numberOfVariants: number) => {
  const rgb = hexRgb(colorHex);
  const colors = [];
  const minBrightness = 0.5; // 50% brightness
  const maxBrightness = 1.0; // 100% brightness
  for (let i = 0; i < numberOfVariants; i++) {
    const factor = i / (numberOfVariants - 1);
    const brightness = minBrightness + (maxBrightness - minBrightness) * factor;
    const newColor = `rgba(
      ${Math.round(rgb.red * brightness)},
      ${Math.round(rgb.green * brightness)},
      ${Math.round(rgb.blue * brightness)},
      ${rgb.alpha})`;
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

const columnChartTooltipPointFormatter = (point: Highcharts.TooltipFormatterContextObject, valuesGivenAsPercentGdp: boolean) => {
  if (!point.y && point.y !== 0) {
    return "";
  }

  let valueDisplay;
  if (valuesGivenAsPercentGdp) {
    valueDisplay = humanReadablePercentOfGdp(point.y).percent;
  } else {
    const abbr = abbreviateMillionsDollars(point.y || 0, 1, true);
    valueDisplay = `$${abbr.amount} ${abbr.unit}`;
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}<span style="font-size: 0.9rem;">: <b>${valueDisplay}</b>`
    + `</span><br/>`;
};

export const costsChartTooltipText = (context: Highcharts.TooltipFormatterContextObject, valuesGivenAsPercentGdp: boolean, nationalGdp: number) => {
  if (!context.total && context.total !== 0) {
    return "";
  }

  let headerText = `${context.x} losses: `;
  if (valuesGivenAsPercentGdp) {
    const percentOfGdp = humanReadablePercentOfGdp(context.total);
    headerText = `${headerText}<b>${percentOfGdp.percent}</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(context.total, 1);
    headerText = `${headerText}<b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b>`;
    if (context.total && context.total > 0) {
      const percentOfGdp = humanReadablePercentOfGdp(((context.total / nationalGdp) * 100));
      headerText = `${headerText}</br>(${percentOfGdp.percent} ${percentOfGdp.reference})`;
    }
  }

  const pointsText = context.points
    ?.filter(point => point.point.custom.includeInTooltips)
    .map((point) => {
      return columnChartTooltipPointFormatter(point, valuesGivenAsPercentGdp);
    })
    ?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};
