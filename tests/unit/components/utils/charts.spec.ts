import { colorBlindSafeLargePalette, getColorVariants } from "~/components/utils/charts";

describe("colorBlindSafeLargePalette", () => {
  it("should be 7 colors long", () => {
    expect(colorBlindSafeLargePalette).toHaveLength(7);
  });
});

describe("getColorVariants", () => {
  it("creates a range of N colors from a base color", () => {
    const baseColor = { name: "Red", rgb: "not used by util", hsl: [0, 100, 50] as HSL };
    const variants = getColorVariants(baseColor, 5);
    expect(variants).toHaveLength(5);
    expect(variants[0].replace(/\s/g, "")).toBe("rgba(255,64,64,1)");
    expect(variants[1].replace(/\s/g, "")).toBe("rgba(255,32,32,1)");
    expect(variants[2].replace(/\s/g, "")).toBe("rgba(255,0,0,1)");
    expect(variants[3].replace(/\s/g, "")).toBe("rgba(223,0,0,1)");
    expect(variants[4].replace(/\s/g, "")).toBe("rgba(191,0,0,1)");
  });
});
