import { colorBlindSafeLargePalette, type TooltipPointInstance } from "./charts";
import { humanReadableInteger } from "./formatters";

export const plotLinesColorName = "Red";
export const plotLinesColor = colorBlindSafeLargePalette.find(c => c.name === plotLinesColorName)!.rgb;
export const plotLinesWidthPx = 2;

export const plotBandsRgbAlpha = 0.3;
export const plotBandsColorName = "Cyan";
export const plotBandsDefaultColor = colorBlindSafeLargePalette.find(c => c.name === plotBandsColorName)!.rgb;
export const addAlphaToRgb = (colorRgb: string, alpha: number): string => {
  return colorRgb.replace("rgb", "rgba").replace(")", `,${alpha})`);
};
export const timeSeriesColors = colorBlindSafeLargePalette
  .filter(c => ![plotBandsColorName, plotLinesColorName].includes(c.name))
  .map(c => c.rgb);

export const multiScenarioTimeSeriesChartTooltipFormatter = (point: TooltipPointInstance, yUnits: string) => {
  const blobHtml = `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `;
  const dayText = `<span style='font-size: 0.7rem; margin-bottom: 0.3rem;'>Day ${point.x}</span><br/>`;
  const yText = `<span style='font-weight: 500'>${humanReadableInteger(point.y?.toFixed(0) ?? "0")}</span> ${yUnits}`;
  if (point.series.options.custom?.isBaseline) {
    return `${blobHtml}${point.series.name} (baseline)<br/>${dayText}${yText}`;
  }
  const baselineSeries = point.series.chart.series.find(s => s.options.custom?.isBaseline);
  const matchingPointInBaseline = baselineSeries?.data.find(p => p.x === point.x);
  return `${blobHtml}${point.series.name}<br/>${dayText}${yText}`
    + ` (baseline: ${humanReadableInteger(matchingPointInBaseline?.y?.toFixed(0) ?? "0")})`;
};

export const timeSeriesChartOptions = {
  marginLeft: 75, // Specify the margin of the y-axis so that all charts' left edges are lined up
  marginTop: 15, // Enough space for a label to fit above the plot band
};

export const timeSeriesXAxisOptions = {
  crosshair: true,
  minTickInterval: 1,
  min: 1,
};

export const timeSeriesYAxisOptions = {
  title: { text: "" },
  min: 0,
};
