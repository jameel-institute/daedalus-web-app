import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

export const stringIsInteger = (num: string): boolean => {
  const parsed = Number.parseInt(num);
  return !Number.isNaN(parsed) && parsed.toString() === num;
};

// Convert number strings to comma-separated thousands format.
// TODO: Localize number formatting.
export const commaSeparatedNumber = (num: string | undefined): string => {
  if (num === undefined) {
    return "";
  }
  if (num[0] === "-") {
    return `-${commaSeparatedNumber(num.slice(1))}`;
  }
  const numberOfDigitsAfterDecimal = num.split(".")[1]?.length;
  num = num.replaceAll(",", "");
  const parsedNum = numberOfDigitsAfterDecimal ? Number.parseFloat(num) : Number.parseInt(num);
  return Intl.NumberFormat(undefined, {
    minimumFractionDigits: numberOfDigitsAfterDecimal,
    maximumFractionDigits: numberOfDigitsAfterDecimal,
  }).format(parsedNum);
};

export const formatOptionLabel = (parameter: Parameter, label: string) => {
  return parameter.parameterType === TypeOfParameter.Numeric ? commaSeparatedNumber(label) : label;
};

export const gdpReferenceYear = "2018";

export const costAsPercentOfGdp = (cost: number | undefined, nationalGdp: number | undefined): number => {
  if (!cost || !nationalGdp) {
    return 0;
  }
  return (cost / nationalGdp) * 100;
};

export const humanReadablePercentOfGdp = (num: number): { percent: string, reference: string } => {
  return {
    percent: commaSeparatedNumber(num.toFixed(num < 100 ? 1 : 0)),
    reference: `of pre-pandemic GDP`,
  };
};

// Convert values expressed in millions to sensible human-readable precision with units
// E.g. 1234567 -> { amount: "1.2", unit: "trillion" }
export const abbreviateMillions = (
  millions: number,
  abbreviateUnits: boolean = false,
  precision?: number,
): {
  amount: string
  unit: string
} => {
  let shortAmount: string;
  let unit: string;
  if (Math.abs(millions) >= 1e6) {
    shortAmount = (millions / 1e6).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "T" : "trillion";
  } else if (Math.abs(millions) >= 1e3) {
    shortAmount = (millions / 1e3).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "B" : "billion";
  } else if (Math.abs(millions) >= 1e0) {
    shortAmount = (millions / 1e0).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "M" : "million";
  } else {
    shortAmount = (millions / 1e-3).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "K" : "thousand";
  }
  if (precision === 0) {
    shortAmount = commaSeparatedNumber(shortAmount);
  }
  return {
    amount: shortAmount,
    unit,
  };
};
