import { abbreviateMillions } from "@/utils/money";

describe("money utils", () => {
  describe("abbreviateMillions", () => {
    it("should convert numbers to trillions, defaulting to precision of 1", () => {
      expect(abbreviateMillions(1234567)).toEqual({ amount: "1.2", unit: "trillion" });
      expect(abbreviateMillions(1234567, true)).toEqual({ amount: "1.2", unit: "T" });
      expect(abbreviateMillions(1234567, true, 2)).toEqual({ amount: "1.23", unit: "T" });
    });

    it("should convert numbers to billions, defaulting to precision of 1", () => {
      expect(abbreviateMillions(1234)).toEqual({ amount: "1.2", unit: "billion" });
      expect(abbreviateMillions(1234, true)).toEqual({ amount: "1.2", unit: "B" });
      expect(abbreviateMillions(1234, true, 2)).toEqual({ amount: "1.23", unit: "B" });
    });

    it("should convert numbers to millions, defaulting to precision of 1", () => {
      expect(abbreviateMillions(1.2345)).toEqual({ amount: "1.2", unit: "million" });
      expect(abbreviateMillions(1.2345, true)).toEqual({ amount: "1.2", unit: "M" });
      expect(abbreviateMillions(1.2345, true, 2)).toEqual({ amount: "1.23", unit: "M" });
    });

    it("should convert numbers to thousands, defaulting to precision of 1", () => {
      expect(abbreviateMillions(0.0012345)).toEqual({ amount: "1.2", unit: "thousand" });
      expect(abbreviateMillions(0.0012345, true)).toEqual({ amount: "1.2", unit: "K" });
      expect(abbreviateMillions(0.0012345, true, 2)).toEqual({ amount: "1.23", unit: "K" });
    });

    it("should handle zero correctly", () => {
      expect(abbreviateMillions(0)).toEqual({ amount: "0.0", unit: "thousand" });
      expect(abbreviateMillions(0, true)).toEqual({ amount: "0.0", unit: "K" });
      expect(abbreviateMillions(0, true, 2)).toEqual({ amount: "0.00", unit: "K" });
    });
  });
});
