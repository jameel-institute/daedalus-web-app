import { abbreviateMillionsDollars } from "~/utils/money";
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { countryFlagClass } from "./countryFlag";
import { getScenarioLabel } from "./comparisons";
import { colorBlindSafeSmallPalette, type TooltipPointInstance } from "./charts";

export const costsChartPalette = colorBlindSafeSmallPalette;

export const costsChartYAxisTitle = (costBasis: CostBasis) => {
  return costBasis === CostBasis.PercentGDP
    ? `Losses as % of GDP`
    : `Losses in billions USD`;
};

const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis) => {
  let valueDisplay;
  if (costBasis === CostBasis.PercentGDP) {
    valueDisplay = `${humanReadablePercentOfGdp(point.y).percent}%`;
  } else {
    const abbr = abbreviateMillionsDollars(point.y || 0, true);
    valueDisplay = `$${abbr.amount} ${abbr.unit}`;
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}<span style="font-size: 0.9rem;">: <b>${valueDisplay}</b>`
    + `</span></span><br/>`;
};

// Tooltip text for a stacked column in a single-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartSingleScenarioTooltip = (context: unknown, costBasis: CostBasis, nationalGdp: number) => {
  const tooltipPointInstance = context as TooltipPointInstance;

  let headerText = `${tooltipPointInstance.point?.category} losses: `;
  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(tooltipPointInstance.total);
    headerText = `${headerText}<b>${percentOfGdp.percent}%</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(tooltipPointInstance.total);
    headerText = `${headerText}<b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b> USD`;
    if (tooltipPointInstance.total > 0) {
      const percentOfGdp = humanReadablePercentOfGdp(costAsPercentOfGdp(tooltipPointInstance.total, nationalGdp));
      headerText = `${headerText}</br>(${percentOfGdp.percent}% ${percentOfGdp.reference})`;
    }
  }

  const pointsText = tooltipPointInstance.points
    ?.filter(point => point.point?.custom.includeInTooltips)
    .map((point) => {
      return costsChartTooltipPointFormatter(point, costBasis);
    })
    ?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Tooltip text for a stacked column in a multi-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartMultiScenarioStackedTooltip = (context: unknown, costBasis: CostBasis, axisParam: Parameter | undefined) => {
  const contextInstance = context as TooltipPointInstance;
  const point = contextInstance.point;
  if (!point || !axisParam) {
    return;
  }

  let headerText = `${axisParam.label}: <b>${getScenarioLabel(point.category as string, axisParam)}</b>`;

  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(point.total);
    headerText = `${headerText}</br></br>Total losses: <b>${percentOfGdp.percent}%</b> ${percentOfGdp.reference}`;
  } else {
    const abbreviatedTotal = abbreviateMillionsDollars(point.total);
    headerText = `${headerText}<br/></br>Total losses: <b>$${abbreviatedTotal.amount} ${abbreviatedTotal.unit}</b> USD`;
    if (point.total > 0) {
      const totalCostAsGdpPercent = point.points?.map(p => p.custom.costAsGdpPercent).reduce((sum, a) => sum + a, 0);
      if (totalCostAsGdpPercent) {
        const percentOfGdp = humanReadablePercentOfGdp(totalCostAsGdpPercent);
        headerText = `${headerText}</br>(${percentOfGdp.percent}% ${percentOfGdp.reference})`;
      }
    }
  }

  const pointsText = point.points?.map(p => costsChartTooltipPointFormatter(p, costBasis))?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Labels for (stacked) columns
export const costsChartStackLabelFormatter = (value: number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value.toFixed(1)}% of GDP`;
  } else if (costBasis === CostBasis.USD) {
    const abbr = abbreviateMillionsDollars(value, false);
    return `$${abbr.amount} ${abbr.unit}`;
  }
};

export const costsChartYAxisTickFormatter = (value: string | number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${value}%`;
  } else if (costBasis === CostBasis.USD) {
    return Object.values(expressMillionsDollarsAsBillions(value as number, 0, true)).join(" ");
  }
};

export const costsChartMultiScenarioXAxisLabelFormatter = (
  category: string,
  axisParam: Parameter | undefined,
  baseline: string | undefined,
) => {
  const scenarioLabel = getScenarioLabel(category, axisParam);
  const paramIsCountry = axisParam?.parameterType === TypeOfParameter.GlobeSelect;
  const marginForFlag = paramIsCountry ? "mt-1" : "";
  const scenarioLabelSpan = baseline && category === baseline
    ? `<span class="fw-medium text-primary-emphasis ${marginForFlag}">${scenarioLabel}</br>(baseline)</span>`
    : `<span class="${marginForFlag}">${scenarioLabel}</span>`;

  if (paramIsCountry) {
    return `<div class="d-flex gap-2 align-items-center mb-2">
      <span
        class="${countryFlagClass(category)}"
        style="width: 1rem; height: 0.75rem;"
      ></span>
      ${scenarioLabelSpan}
    </div>`;
  } else {
    return scenarioLabelSpan;
  }
};
