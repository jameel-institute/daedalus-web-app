import { commaSeparatedNumber } from "~/components/utils/formatters";

export const expressMillionsDollarsAsBillions = (
  amount: number,
  precision: number = 1,
  abbreviateUnits: boolean = false,
): {
  amount: string
  unit: string
} => {
  let shortAmount = (amount / 1e3).toFixed(precision);
  const beforeDecimal = shortAmount.split(".")[0];
  const afterDecimal = shortAmount.split(".")[1];
  shortAmount = [commaSeparatedNumber(beforeDecimal), afterDecimal]
    .filter(Boolean)
    .join(".");
  return {
    amount: shortAmount,
    unit: abbreviateUnits ? "B" : "billion",
  };
};
