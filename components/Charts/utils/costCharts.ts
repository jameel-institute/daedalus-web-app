import { abbreviateMillionsDollars, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { colorBlindSafeSmallPalette, type TooltipPointInstance } from "../../utils/charts";

export const costsChartPalette = colorBlindSafeSmallPalette;

export const thickPlotLineForDiffedChart = { value: 0, color: "black", zIndex: 1 };

export const costsChartYAxisTitle = (costBasis: CostBasis, diffing?: boolean) => {
  const lossesText = diffing ? "Relative losses" : "Losses";
  return `${lossesText} ${costBasis === CostBasis.PercentGDP ? "as % of GDP" : "in billions USD"}`;
};

export const valueColor = (value: number, diffing: boolean) => {
  if (!diffing || value === 0) {
    return "inherit";
  }
  return value > 0 ? "darkred" : "darkgreen";
};

export const displayValue = (value: number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return humanReadablePercentOfGdp(value).percent;
  } else {
    const abbr = abbreviateMillionsDollars(value, true);
    return `${abbr.amount} ${abbr.unit}`;
  }
};

export const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis, diffing: boolean) => {
  const val = point.y || 0;

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}: `
    + `<span style="font-weight: bold; color: ${valueColor(point.y, diffing)}">${displayValue(val, costBasis)}</span>`
    + `</span><br/>`;
};

export const costsChartYAxisTickFormatter = (value: string | number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value}%`;
  } else if (costBasis === CostBasis.USD) {
    return Object.values(expressMillionsDollarsAsBillions(value as number, 0, true)).join(" ");
  }
};
