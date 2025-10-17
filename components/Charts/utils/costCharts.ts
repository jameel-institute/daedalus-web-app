import { abbreviateMillionsDollars } from "~/utils/money";
import { costAsPercentOfGdp, humanReadablePercentOfGdp } from "~/components/utils/formatters";
import { CostBasis } from "~/types/unitTypes";
import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";
import { countryFlagClass } from "../../utils/countryFlag";
import { getScenarioLabel } from "../../utils/comparisons";
import { colorBlindSafeSmallPalette, type TooltipPointInstance } from "../../utils/charts";

export const costsChartPalette = colorBlindSafeSmallPalette;

export const costsChartYAxisTitle = (costBasis: CostBasis, diffing?: boolean) => {
  const lossesText = diffing ? "Relative losses" : "Losses";
  return `${lossesText} ${costBasis === CostBasis.PercentGDP ? "as % of GDP" : "in billions USD"}`;
};

const valueColor = (value: number, diffing: boolean) => {
  if (!diffing || value === 0) {
    return "inherit";
  }
  return value > 0 ? "darkred" : "darkgreen";
};

// A wrapper for abbreviateMillionsDollars that ensures the correct order of negative sign and dollar sign.
const displayMillionsDollars = (value: number, abbreviateUnits?: boolean, precision?: number) => {
  const abbr = abbreviateMillionsDollars(value, abbreviateUnits, precision);
  if (value >= 0) {
    return `$${abbr.amount} ${abbr.unit}`;
  } else {
    const abbrEls = abbr.amount.split("-");
    return `-$${abbrEls[abbrEls.length - 1]} ${abbr.unit}`;
  }
};

const costsChartTooltipPointFormatter = (point: TooltipPointInstance, costBasis: CostBasis, diffing: boolean) => {
  const val = point.y || 0;
  let valueDisplay;
  if (costBasis === CostBasis.PercentGDP) {
    valueDisplay = `${humanReadablePercentOfGdp(val).percent}%`;
  } else {
    valueDisplay = displayMillionsDollars(val, true);
  }

  return `<span style="font-size: 0.8rem;">`
    + `<span style="color:${point.color}; font-size: 1.3rem;">●</span> `
    + `<span style="font-size: 0.8rem;">${point.key}: `
    + `<span style="font-weight: bold; color: ${valueColor(point.y, diffing)}">${valueDisplay}</span>`
    + `</span><br/>`;
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
      return costsChartTooltipPointFormatter(point, costBasis, false);
    })
    ?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Tooltip text for a stacked column in a multi-scenario costs chart (shared tooltip for all points in the stack)
export const costsChartMultiScenarioStackedTooltip = (
  context: unknown,
  costBasis: CostBasis,
  axisParam: Parameter | undefined,
  diffing: boolean,
) => {
  const contextInstance = context as TooltipPointInstance;
  const point = contextInstance.point;
  // NB: when some sub-stacks are negative, the `point.total` is the sum of only the positive
  // sub-stacks, not the actual net total. So we have to calculate that total ourselves.
  const totalStackValue = point?.custom.stackNetTotal;
  if (!point || !axisParam || totalStackValue === undefined) {
    return;
  }

  let headerText = `${axisParam.label}: <b>${getScenarioLabel(point.category as string, axisParam)}</b>`;
  const totalLossesText = diffing ? "Net losses relative to baseline:</br>" : "Total losses: ";
  const totalColor = valueColor(totalStackValue, diffing);

  if (costBasis === CostBasis.PercentGDP) {
    const percentOfGdp = humanReadablePercentOfGdp(totalStackValue);
    headerText = `${headerText}</br></br>${totalLossesText}<b>`
      + `<span style="color: ${totalColor}">${percentOfGdp.percent}%</span>`
      + `</b> ${percentOfGdp.reference}`;
  } else {
    headerText = `${headerText}<br/></br>${totalLossesText}<b>`
      + `<span style="color: ${totalColor}">${displayMillionsDollars(totalStackValue)}</span>`
      + `</b> USD`;
    if (totalStackValue !== 0) {
      const totalCostAsGdpPercent = point.points?.map(p => p.custom.costAsGdpPercent!).reduce((sum, a) => sum + a, 0);
      if (totalCostAsGdpPercent) {
        const percentOfGdp = humanReadablePercentOfGdp(totalCostAsGdpPercent);
        headerText = `${headerText}</br>(${percentOfGdp.percent}% ${percentOfGdp.reference})`;
      }
    }
  }

  const pointsText = point.points?.map(p => costsChartTooltipPointFormatter(p, costBasis, diffing))?.join("");

  return `<span style="font-size: 0.8rem;">${headerText}<br/><br/>${pointsText}</span>`;
};

// Labels for (stacked) columns for single scenario cost charts
export const costsChartStackLabelFormatter = (value: number, costBasis: CostBasis) => {
  if (costBasis === CostBasis.PercentGDP) {
    return `${humanReadablePercentOfGdp(value).percent}% of GDP`;
  } else if (costBasis === CostBasis.USD) {
    const abbr = abbreviateMillionsDollars(value, false);
    return `$${abbr.amount} ${abbr.unit}`;
  }
};

// The TS declarations for the stack item object aren't correct, so we declare our own interface:
interface StackLabelItem extends Highcharts.StackItemObject {
  axis: Highcharts.StackItemObject["axis"] & {
    series: Array<Highcharts.Series & { stackKey: string }>
    stacking: {
      stacks: Record<string, Record<string, Highcharts.StackItemObject>>
    }
  }
}

// Labels for (stacked) columns for multi-scenario cost charts
export const costsChartMultiScenarioStackLabelFormatter = (stackLabelItem: unknown, costBasis: CostBasis, diffing: boolean) => {
  const stackLabel = stackLabelItem as StackLabelItem;
  // If the stack extends both positively and negatively, Highcharts will create two labels for each stack:
  // (A) the total of the positive values, at the top, and (B) the total of the negative values, at the bottom.
  // We only want to show one stack label in each stack, with the label showing instead a *net* total for the whole stack.

  // To identify how many stack labels belong to the current stack:
  // 1) Check stackLabelItem.axis.stacking.stacks to get all of the stack labels, which are keyed by their x-positional index,
  // nested under a dynamically generated key (the 'stack-key').
  // 2) If the current x-positional index exists at both, we can then tell which of the pos and neg stack labels we are dealing with
  // here by checking if the current stack total is negative.

  // xPositionIndex identifies stack labels by the index of the column they belong to.
  const xPositionIndex = stackLabel.x;
  // All series expose a dynamically generated stack-key, under 'stackKey'. This appears to always be "column,,," for all series.
  // If there are negative sub-stacks, the key "-column,,," (NB prefaced with "-") is also used.
  // (Incidentally, this stack-key is generated here: https://github.com/highcharts/highcharts/blob/0892407957a6e6254667dc3abb5c36469780f63d/ts/Core/Axis/Stacking/StackingAxis.ts#L220 )
  const stackKey = stackLabel.axis?.series?.[0]?.stackKey;
  const positiveStacks = stackLabel.axis?.stacking?.stacks?.[stackKey];
  const negativeStacks = stackLabel.axis?.stacking?.stacks?.[`-${stackKey}`];
  const hasBothStackLabels = positiveStacks?.[xPositionIndex] && negativeStacks?.[xPositionIndex];
  const positiveTotal = positiveStacks?.[xPositionIndex]?.total || 0;
  const negativeTotal = negativeStacks?.[xPositionIndex]?.total || 0;
  if (hasBothStackLabels) {
    // Omit the label of the least significant extent (pos/neg) of the stack if two labels exist for the current stack.
    // Note that there are three possibilities: we could have a positive label, a negative label, or both.
    const thisStackIsBigger = stackLabel.isNegative
      ? Math.abs(negativeTotal) >= Math.abs(positiveTotal)
      : Math.abs(positiveTotal) >= Math.abs(negativeTotal);
    if (!thisStackIsBigger) {
      return "";
    }
  }

  const netTotal = positiveTotal + negativeTotal;
  const totalColor = valueColor(netTotal, diffing);

  return `<span style="color: ${totalColor}">`
    + `${costBasis === CostBasis.PercentGDP ? `${humanReadablePercentOfGdp(netTotal).percent}%` : displayMillionsDollars(netTotal, true)}`
    + `${hasBothStackLabels ? " (net)" : ""}</span>`;
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
    ? `<span class="boldish text-primary-emphasis ${marginForFlag}">${scenarioLabel}</span>`
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
