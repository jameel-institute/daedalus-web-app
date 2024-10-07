import hexRgb from "hex-rgb";
import * as Highcharts from "highcharts";

export const hideResetZoomButtonClassName = "hide-reset-zoom-button";

const originalHighchartsColors = Highcharts.getOptions().colors;
const colorRgba = hexRgb(originalHighchartsColors[0]);
colorRgba.alpha = 0.3;
export const plotBandsColor = `rgba(${Object.values(colorRgba).join(",")})`;
export const plotLinesColor = "#FF0000"; // red;
export const timeSeriesColors = originalHighchartsColors!.slice(1);
export const costsPieColors = ["transparent"].concat(originalHighchartsColors); // Make the center circle be transparent
