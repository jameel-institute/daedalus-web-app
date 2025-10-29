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

// Convert values expressed in millions of dollars to sensible human-readable precision with units
// E.g. 1234567 -> { amount: "1.2", unit: "trillion" }
export const abbreviateMillionsDollars = (
  millionsDollars: number,
  abbreviateUnits: boolean = false,
  precision?: number,
): {
  amount: string
  unit: string
} => {
  if (Math.abs(millionsDollars) < 1) {
    return {
      amount: "<$1",
      unit: abbreviateUnits ? "M" : "million",
    };
  }
  const dollars = millionsDollars * 1_000_000;
  const [amount, unitAbbr] = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: precision ?? 1,
    minimumFractionDigits: precision ?? 1,
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  }).format(dollars).split(/([KMBT])/);
  let unit;
  if (!abbreviateUnits) {
    unit = {
      K: "thousand",
      M: "million",
      B: "billion",
      T: "trillion",
    }[unitAbbr];
  }
  return {
    amount,
    unit: unit ?? unitAbbr ?? "",
  };
};
