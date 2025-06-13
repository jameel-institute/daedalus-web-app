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
      [1234.56, "1,235"],
      [1234.56, "£1,234.6", "GBP", "en-GB", 1],
      [1234.56, "1.234,56 €", "EUR", "de-DE", 2],
      [1234.56, "￥1,235", "JPY", "ja-JP"],
      [1234.56, "₹1,234.56", "INR", "hi-IN", 2],
      [1234.56, "1 235 $US", "USD", "fr-FR", 0],
      [-1234.56, "-1,235"],
      [0, "0"],
      [1234567890.12, "1,234,567,890"],
      [0.12, "$0.12", "USD", "en-US", 2],
    ])(
      "should format %d to %s",
      (
        value,
        expected,
        currency = undefined,
        locales = "en-US",
        maximumFractionDigits = 0,
      ) => {
        expect(
          formatCurrency(value, currency, locales, maximumFractionDigits),
        ).toBe(expected);
      },
    );
  });

  describe("expressMillionsDollarsAsBillions", () => {
    it("should always return in billions, even if millions/trillions would be more abbreviated", () => {
      expect(expressMillionsDollarsAsBillions(1_234_567_890_123.456, 3, false)).toEqual({
        amount: "1234567890.123",
        unit: "billion",
      });

      expect(expressMillionsDollarsAsBillions(1.234, 1, true)).toEqual({
        amount: "0.0",
        unit: "B",
      });
    });

    it("uses comma-formatting when the precision requested is 0", () => {
      expect(expressMillionsDollarsAsBillions(1_234_567.01234, 0, false)).toEqual({
        amount: "1,235",
        unit: "billion",
      });
    });
  });
});
