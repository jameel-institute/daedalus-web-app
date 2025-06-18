import { type Parameter, TypeOfParameter } from "~/types/parameterTypes";

export const stringIsInteger = (num: string): boolean => {
  const parsed = Number.parseInt(num);
  return !Number.isNaN(parsed) && parsed.toString() === num;
};

// Convert strings to human readable format (i.e. with comma-separated thousands).
// TODO: Localize number formatting.
export const humanReadableInteger = (num: string): string => {
  return stringIsInteger(num) ? new Intl.NumberFormat().format(Number.parseInt(num)) : num;
};

export const formatOptionLabel = (parameter: Parameter, label: string) => {
  return parameter.parameterType === TypeOfParameter.Numeric ? humanReadableInteger(label) : label;
};
