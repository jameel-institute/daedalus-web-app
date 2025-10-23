import { commaSeparatedNumber } from "~/components/utils/formatters";

// Convert values expressed in millions of dollars to sensible human-readable precision with units
// E.g. 1234567 -> { amount: "1.2", unit: "trillion" }
export const abbreviateMillionsDollars = (
  amount: number,
  abbreviateUnits: boolean = false,
  precision?: number,
): {
  amount: string
  unit: string
} => {
  let shortAmount: string;
  let unit: string;
  if (Math.abs(amount) >= 1e6) {
    shortAmount = (amount / 1e6).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "T" : "trillion";
  } else if (Math.abs(amount) >= 1e3) {
    shortAmount = (amount / 1e3).toFixed(precision ?? 1);
    unit = abbreviateUnits ? "B" : "billion";
  } else {
    shortAmount = amount.toFixed(precision ?? 0);
    unit = abbreviateUnits ? "M" : "million";
  }
  if (precision === 0) {
    shortAmount = commaSeparatedNumber(shortAmount);
  }
  return {
    amount: shortAmount,
    unit,
  };
};

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
