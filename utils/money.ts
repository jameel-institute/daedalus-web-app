import { humanReadableInteger } from "~/components/utils/formatters";

// Convert values expressed in millions of dollars to sensible human-readable precision with units
// E.g. 1.234567e6 -> { amount: "1.2", unit: "trillion" }
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
  if (precision === 0) {
    shortAmount = humanReadableInteger(shortAmount);
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
  if (precision === 0) {
    shortAmount = humanReadableInteger(shortAmount);
  }
  return {
    amount: shortAmount,
    unit: abbreviateUnits ? "B" : "billion",
  };
};

/**
 * Formats a number as a currency string.
 *
 * @param value - The numeric value to format.
 * @param currency - A string with the currency code (ISO 4217 format). Defaults to "USD".
 * @param locales - A string with a BCP 47 language tag, or an array of such strings. Defaults to "en-US".
 * @param maximumFractionDigits - The maximum number of fraction digits to display. Defaults to 0.
 * @returns A string representing the formatted currency.
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56); // "$1,235"
 * formatCurrency(1234.56, "en-GB", "GBP", 1); // "£1,234.6"
 * formatCurrency(1234.56, "de-DE", "EUR", 2); // "1.234,56€"
 * ```
 */
export const formatCurrency = (
  value: number,
  currency?: string,
  locales = "en-US",
  maximumFractionDigits = 0,
): string => {
  return new Intl.NumberFormat(locales, {
    ...(currency && { style: "currency", currency }),
    maximumFractionDigits,
  }).format(value);
};
