import { abbreviateMillions } from "@/utils/money";

describe("money utils", () => {
  describe("abbreviateMillions", () => {
    it("should convert large numbers to trillions, defaulting to precision of 1", () => {
      expect(abbreviateMillions(1234567)).toEqual({ amount: "1.2", unit: "trillion" });
      expect(abbreviateMillions(1234567, true)).toEqual({ amount: "1.2", unit: "T" });
      expect(abbreviateMillions(1234567, true, 2)).toEqual({ amount: "1.23", unit: "T" });
    });

    it("should convert large numbers to billions, defaulting to precision of 1", () => {
      expect(abbreviateMillions(1234)).toEqual({ amount: "1.2", unit: "billion" });
      expect(abbreviateMillions(1234, true)).toEqual({ amount: "1.2", unit: "B" });
      expect(abbreviateMillions(1234, true, 2)).toEqual({ amount: "1.23", unit: "B" });
    });

    it("should convert small numbers to millions, defaulting to precision of 0", () => {
      expect(abbreviateMillions(1.2345)).toEqual({ amount: "1", unit: "million" });
      expect(abbreviateMillions(1.2345, true)).toEqual({ amount: "1", unit: "M" });
      expect(abbreviateMillions(1.2345, true, 2)).toEqual({ amount: "1.23", unit: "M" });
    });

    it("should handle zero correctly", () => {
      expect(abbreviateMillions(0)).toEqual({ amount: "0", unit: "million" });
      expect(abbreviateMillions(0, true)).toEqual({ amount: "0", unit: "M" });
      expect(abbreviateMillions(0, true, 2)).toEqual({ amount: "0.00", unit: "M" });
    });
  });
});
