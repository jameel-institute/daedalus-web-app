import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

export const stringIsInteger = (num: string): boolean => {
  const parsed = Number.parseInt(num);
  return !Number.isNaN(parsed) && parsed.toString() === num;
};

// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableInteger = (num: string | undefined): string => {
  if (num === undefined) {
    return "";
  }
  return stringIsInteger(num) ? new Intl.NumberFormat().format(Number.parseInt(num)) : num;
};

export const formatOptionLabel = (parameter: Parameter, label: string) => {
  return parameter.parameterType === TypeOfParameter.Numeric ? humanReadableInteger(label) : label;
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
    percent: `${num.toFixed(num < 100 ? 1 : 0)}`,
    reference: `of ${gdpReferenceYear} national GDP`,
  };
};
