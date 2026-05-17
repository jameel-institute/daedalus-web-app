import { compactValueWithSign, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { abbreviateMillionsDollars } from "@/utils/money";
import { CostBasis } from "~/types/unitTypes";
import { colorBlindSafeSmallPalette, type TooltipPointInstance } from "../../utils/charts";

export const costsChartPalette = colorBlindSafeSmallPalette;

export const thickPlotLineForDiffedChart = { value: 0, color: "black", zIndex: 1 };

export const costsChartYAxisTitle = (metric: Metric, costBasis?: CostBasis, diffing?: boolean) => {
  switch (metric) {
    case LIFE_YEARS_METRIC:
      return diffing ? "Relative life years lost" : "Life years lost";
    default: {
      const lossesText = diffing ? "Relative losses" : "Losses";
      return `${lossesText} ${costBasis === CostBasis.PercentGDP ? "as % of GDP" : "in billions USD"}`;
    }
  }
};

export const valueColor = (value: number, diffing: boolean) => {
  if (!diffing || value === 0) {
    return "inherit";
  }
  return value > 0 ? "darkred" : "darkgreen";
};

export const lifeYearsAbbreviated = (value: number) => {
  const val = value as number;
  const absVal = Math.abs(val);
  return compactValueWithSign(val, absVal > 10_000 ? 4 : 1);
};

export const displayValue = (value: number, metric: Metric, costBasis?: CostBasis) => {
  switch (metric) {
    case LIFE_YEARS_METRIC:
      return lifeYearsAbbreviated(value);
    default: {
      if (costBasis === CostBasis.PercentGDP) {
        return humanReadablePercentOfGdp(value).percent;
      } else {
        return Object.values(abbreviateMillionsDollars(value, true)).join("");
      }
    }
  };
};

export const costsChartTooltipPointFormatter = (point: TooltipPointInstance, diffing: boolean, metric: Metric, costBasis?: CostBasis) => {
  const val = point.y || 0;

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}: `
    + `<span style="font-weight: bold; color: ${valueColor(val, diffing)}">${displayValue(val, metric, costBasis)}</span>`
    + `</span><br/>`;
};

export const costsChartYAxisTickFormatter = (value: string | number, metric: Metric, costBasis?: CostBasis) => {
  switch (metric) {
    case LIFE_YEARS_METRIC: {
      return lifeYearsAbbreviated(value as number);
    }
    default: {
      if (costBasis === CostBasis.PercentGDP) {
        return `${value}%`;
      } else if (costBasis === CostBasis.USD) {
        return Object.values(abbreviateMillionsDollars(value as number, true, "auto", 0, 2, true)).join("");
      }
    }
  }
};
