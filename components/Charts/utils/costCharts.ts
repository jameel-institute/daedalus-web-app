import { abbreviateMillionsDollars } from "~/utils/money";
import { humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { colorBlindSafeSmallPalette, type TooltipPointInstance } from "../../utils/charts";

export const costsChartPalette = colorBlindSafeSmallPalette;

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

// A wrapper for abbreviateMillionsDollars that ensures the correct order of negative sign and dollar sign.
export const displayMillionsDollars = (value: number, abbreviateUnits?: boolean, precision?: number) => {
  const abbr = abbreviateMillionsDollars(value, abbreviateUnits, precision);
  if (value >= 0) {
    return `$${abbr.amount} ${abbr.unit}`;
  } else {
    const abbrEls = abbr.amount.split("-");
    return `-$${abbrEls[abbrEls.length - 1]} ${abbr.unit}`;
  }
};

export const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis, diffing: boolean) => {
  const val = point.y || 0;
  let valueDisplay;
  if (costBasis === CostBasis.PercentGDP) {
    valueDisplay = `${humanReadablePercentOfGdp(val).percent}%`;
  } else {
    valueDisplay = displayMillionsDollars(val, true);
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}`
    + `<span style="font-size: 0.9rem; color: ${valueColor(point.y, diffing)}">: <b>${valueDisplay}</b></span>`
    + `</span><br/>`;
};

export const costsChartYAxisTickFormatter = (value: string | number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value}%`;
  } else if (costBasis === CostBasis.USD) {
    return Object.values(expressMillionsDollarsAsBillions(value as number, 0, true)).join(" ");
  }
};
