import { abbreviateMillionsDollars } from "#imports";
import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";

const originalHighchartsColors = Highcharts.getOptions().colors;
const colorRgba = hexRgb(originalHighchartsColors[0] as string);
colorRgba.alpha = 0.3;
export const plotBandsColor = `rgba(${Object.values(colorRgba).join(",")})`;
export const plotLinesColor = "#FF0000"; // red;
export const timeSeriesColors = originalHighchartsColors!.slice(1);
const costsPieColorsBase = originalHighchartsColors!.slice(2) as ArrayLike<string>; // Skip first two colors as being too vibrant
export const costsPieColors = ["rgba(1,1,1,0)"].concat(Array.from<string>(costsPieColorsBase)); // Make the center circle translucent

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

export const costsPieTooltipText = (point: Highcharts.Point, nationalGdp: number) => {
  const abbr = abbreviateMillionsDollars(point.value);
  // The 'Total' cost/point has an 'i' of 0. When queried for the i of its own, non-existent parent, it returns -1.
  const pointIsTotal = point.node.i === 0;
  const parentIsTotal = point.node.parentNode.i === 0;
  const header = pointIsTotal || parentIsTotal ? point.name : [point.node.parentNode.name, point.name].join(": ");
  const base = `<b>${header}</b><br/>\n$${abbr.amount} ${abbr.unit}`;
  return `${base}<br/>\n${((point.value / nationalGdp) * 100).toFixed(1)}% of national GDP`;
};