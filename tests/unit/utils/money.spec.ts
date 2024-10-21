import { abbreviateMillionsDollars, formatCurrency } from "@/utils/money";

describe("money utils", () => {
  describe("abbreviateMillionsDollars", () => {
    it.each([
      [1_234_567.01234, { amount: "1.2", unit: "trillion" }],
      [1_234.01234, { amount: "1.2", unit: "billion" }],
      [1.234567890123, { amount: "1.2", unit: "million" }],
      [0.4567890123, { amount: "0.5", unit: "million" }],
      [9_876_543_210.01234, { amount: "9876.54", unit: "trillion" }, 2],
      [5_555_555.01234, { amount: "5.6", unit: "T" }, 1, true],
      [3_333.01234, { amount: "3.3", unit: "B" }, undefined, true],
      [9.01234, { amount: "9.012", unit: "M" }, 3, true],
    ])(
      "should convert %d to %o",
      (amount, expected, precision = 1, abbreviateUnits = false) => {
        expect(
          abbreviateMillionsDollars(amount, precision, abbreviateUnits),
        ).toEqual(expected);
      },
    );
  });

  describe("formatCurrency", () => {
    it.each([
      [1234.56, "$1,235"],
      [1234.56, "£1,234.6", "en-GB", "GBP", 1],
      [1234.56, "1.234,56 €", "de-DE", "EUR", 2],
      [1234.56, "￥1,235", "ja-JP", "JPY"],
      [1234.56, "₹1,234.56", "hi-IN", "INR", 2],
      [1234.56, "1 235 $US", "fr-FR", "USD", 0],
      [-1234.56, "-$1,235"],
      [0, "$0"],
      [1234567890.12, "$1,234,567,890"],
      [0.12, "$0.12", "en-US", "USD", 2],
    ])(
      "should format %d to %s",
      (
        value,
        expected,
        locales = "en-US",
        currency = "USD",
        maximumFractionDigits = 0,
      ) => {
        expect(
          formatCurrency(value, locales, currency, maximumFractionDigits),
        ).toBe(expected);
      },
    );
  });
});
