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
