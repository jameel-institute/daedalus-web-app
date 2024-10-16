import { abbreviateMillionsDollars } from "@/utils/money";

describe("abbreviateMillionsDollars", () => {
  it("should convert million dollars to trillion with full unit name", () => {
    expect(abbreviateMillionsDollars(1_234_567.01234)).toEqual({ amount: "1.2", unit: "trillion" });
  });

  it("should convert million dollars to billion with full unit name", () => {
    expect(abbreviateMillionsDollars(1_234.01234)).toEqual({ amount: "1.2", unit: "billion" });
  });

  it("should convert million dollars to million with full unit name", () => {
    expect(abbreviateMillionsDollars(1.234567890123)).toEqual({ amount: "1.2", unit: "million" });
  });

  it("should handle amounts less than a million", () => {
    expect(abbreviateMillionsDollars(0.4567890123)).toEqual({ amount: "0.5", unit: "million" });
  });

  it("should allow custom precision", () => {
    expect(abbreviateMillionsDollars(9_876_543_210.01234, 2)).toEqual({ amount: "9876.54", unit: "trillion" });
  });

  it("should abbreviate units when requested", () => {
    expect(abbreviateMillionsDollars(5_555_555.01234, 1, true)).toEqual({ amount: "5.6", unit: "T" });
    expect(abbreviateMillionsDollars(3_333.01234, undefined, true)).toEqual({ amount: "3.3", unit: "B" });
    expect(abbreviateMillionsDollars(9.01234, 3, true)).toEqual({ amount: "9.012", unit: "M" });
  });
});
