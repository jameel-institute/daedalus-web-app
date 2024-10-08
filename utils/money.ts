// Convert values expressed in millions of dollars to sensible human-readable precision with units
// E.g. 1.234567e12 -> { amount: "1.2", unit: "trillion" }
export const abbreviateMillionsDollars = (
  amount: number,
  precision: number = 1,
  abbreviateUnits: boolean = false,
): {
  amount: string
  unit: string
} => {
  let shortAmount: string;
  let unit: string;
  if (amount >= 1e6) {
    shortAmount = (amount / 1e6).toFixed(precision);
    unit = abbreviateUnits ? "T" : "trillion";
  } else if (amount >= 1e3) {
    shortAmount = (amount / 1e3).toFixed(precision);
    unit = abbreviateUnits ? "B" : "billion";
  } else {
    shortAmount = amount.toFixed(precision);
    unit = abbreviateUnits ? "M" : "million";
  }
  return {
    amount: shortAmount,
    unit,
  };
};
