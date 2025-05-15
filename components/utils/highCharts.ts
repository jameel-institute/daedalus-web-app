import { abbreviateMillionsDollars } from "#imports";
import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";

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
  return colors;
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

const columnChartTooltipPointFormatter = (yValue: number, color: string, name: string, valuesGivenAsPercentGdp: boolean) => {
  if (valuesGivenAsPercentGdp) {
    return `<span style="font-size: 0.8rem;">`
      + `<span style="color:${color}; font-size: 1.3rem;">●</span> `
      + `<span style="font-size: 0.8rem;">${name}<span style="font-size: 0.9rem;">: <b>${yValue.toFixed(1)}%</b>`
      + `</span><br/>`;
  } else {
    const abbr = abbreviateMillionsDollars(yValue || 0, 1, true);
    return `<span style="font-size: 0.8rem;">`
      + `<span style="color:${color}; font-size: 1.3rem;">●</span> `
      + `<span style="font-size: 0.8rem;">${name}<span style="font-size: 0.9rem;">: <b>$${abbr.amount} ${abbr.unit}</b>`
      + `</span><br/>`;
  }
};

export const costsChartTooltipText = (context: Highcharts.TooltipFormatterContextObject, valuesGivenAsPercentGdp: boolean, sharedTooltipsMode: boolean, nationalGdp: number) => {
  let headerText = "";
  if (valuesGivenAsPercentGdp) {
    headerText = `${context.x}: <b>${context.total?.toFixed(1)}%</b> of 2018 national GDP`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(context.total, 1);
    headerText = `${context.x}: <b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b>`;
    if (context.total && context.total > 0) {
      headerText = `${headerText}</br>(<b>${((context.total / nationalGdp) * 100).toFixed(1)}%</b> of 2018 national GDP)`;
    }
  }

  let pointsText;
  if (sharedTooltipsMode) {
    pointsText = context.points?.filter(point => point.point.name).map(point => columnChartTooltipPointFormatter(point.y, point.color, point.key, valuesGivenAsPercentGdp))?.join("");
  } else {
    pointsText = columnChartTooltipPointFormatter(context.y, context.color, context.point.name, valuesGivenAsPercentGdp);
  }

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};
