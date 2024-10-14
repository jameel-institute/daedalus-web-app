import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";

const originalHighchartsColors = Highcharts.getOptions().colors;
const colorRgba = hexRgb(originalHighchartsColors[0]);
colorRgba.alpha = 0.3;
export const plotBandsColor = `rgba(${Object.values(colorRgba).join(",")})`;
export const plotLinesColor = "#FF0000"; // red;
export const timeSeriesColors = originalHighchartsColors!.slice(1);
const costsPieColorsBase = originalHighchartsColors!.slice(2); // Skip first two colors as being too vibrant
export const costsPieColors = ["rgba(1,1,1,0.1)"].concat(costsPieColorsBase); // Make the center circle translucent

export interface LegendItem {
  color: string
  label: string
  shape: string
}

export enum LegendShape {
  Rectangle = "rectangle",
  Line = "line",
}
