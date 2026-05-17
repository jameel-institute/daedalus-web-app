import type { TooltipPointInstance } from "~/components/utils/charts";
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { abbreviateMillionsDollars } from "@/utils/money";
import { CostBasis } from "~/types/unitTypes";
import { costsChartTooltipPointFormatter, lifeYearsAbbreviated } from "./costCharts";

// Tooltip text for a stacked column in a single-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartSingleScenarioTotalTooltip = (context: unknown, costBasis?: CostBasis, nationalGdp?: number) => {
  const tooltipPointInstance = context as TooltipPointInstance;

  let headerText = `${tooltipPointInstance.point?.category} losses: `;
  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(tooltipPointInstance.total);
    headerText = `${headerText}<b>${percentOfGdp.percent}</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(tooltipPointInstance.total);
    headerText = `${headerText}<b>${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b> USD`;
    if (tooltipPointInstance.total > 0) {
      const percentOfGdp = humanReadablePercentOfGdp(costAsPercentOfGdp(tooltipPointInstance.total, nationalGdp));
      headerText = `${headerText}</br>(${percentOfGdp.percent} ${percentOfGdp.reference})`;
    }
  }

  const pointsText = tooltipPointInstance.points
    ?.filter(point => point.point?.custom.includeInTooltips)
    .map((point) => {
      return costsChartTooltipPointFormatter(point, false, USD_METRIC, costBasis);
    })
    ?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Tooltip text for a column in a single-scenario costs chart
export const costsChartSingleScenarioLifeYearsTooltip = (context: unknown) => {
  const tooltipPointInstance = context as TooltipPointInstance;

  if (!tooltipPointInstance.point?.y) {
    return;
  }

  const dollarAmountInMillions = tooltipPointInstance.point?.custom?.dollarAmountInMillions;
  let dollarText = "";
  if (dollarAmountInMillions) {
    const { amount, unit } = abbreviateMillionsDollars(dollarAmountInMillions);
    dollarText = `<br/><br/>As losses in USD: ${amount} ${unit}`;
  }

  return `<span style="font-size: 0.8rem;">
    ${costsChartTooltipPointFormatter(tooltipPointInstance, false, LIFE_YEARS_METRIC)} life years lost
  </span>${dollarText}`;
};

// Labels for (stacked) columns for single scenario cost charts
export const costsChartSingleScenarioStackLabelFormatter = (value: number, metric: Metric, costBasis?: CostBasis) => {
  switch (metric) {
    case LIFE_YEARS_METRIC:
      return `${lifeYearsAbbreviated(value)} life years`;
    default:
      if (costBasis === CostBasis.PercentGDP) {
        return `${humanReadablePercentOfGdp(value).percent} of GDP`;
      } else if (costBasis === CostBasis.USD) {
        return Object.values(abbreviateMillionsDollars(value, false)).join(" ");
      }
  }
};
