import { abbreviateMillionsDollars } from "~/utils/money";

describe("abbreviateMillionsDollars", () => {
  it("should convert numbers to trillions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1234567)).toEqual({ amount: "$1.2", unit: "trillion" });
    expect(abbreviateMillionsDollars(1234567, true)).toEqual({ amount: "$1.2", unit: "T" });
    expect(abbreviateMillionsDollars(1234567, true, undefined, 2)).toEqual({ amount: "$1.23", unit: "T" });
    expect(abbreviateMillionsDollars(1234567, true, "always", 2)).toEqual({ amount: "+$1.23", unit: "T" });
    expect(abbreviateMillionsDollars(1234567, true, "auto", undefined, 4)).toEqual({ amount: "$1.235", unit: "T" });
  });

  it("should convert numbers to billions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1234)).toEqual({ amount: "$1.2", unit: "billion" });
  });

  it("should convert numbers to millions, defaulting to precision of 1", () => {
    expect(abbreviateMillionsDollars(1.2345)).toEqual({ amount: "$1.2", unit: "million" });
  });

  it("should handle small numbers correctly", () => {
    expect(abbreviateMillionsDollars(0.0012345)).toEqual({ amount: "<$1", unit: "million" });
    expect(abbreviateMillionsDollars(0.0012345, true)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0.0012345, true, undefined, 2)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0.0012345, true, undefined, 3, undefined, true)).toEqual({ amount: "$1.235", unit: "K" });
  });

  it("should handle zero correctly", () => {
    expect(abbreviateMillionsDollars(0)).toEqual({ amount: "<$1", unit: "million" });
    expect(abbreviateMillionsDollars(0, true)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0, true, undefined, 2)).toEqual({ amount: "<$1", unit: "M" });
    expect(abbreviateMillionsDollars(0, true, undefined, 2, undefined, true)).toEqual({ amount: "$0.00", unit: "" });
  });
});
