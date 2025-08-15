import { numericValueInvalid, numericValueIsOutOfRange } from "~/components/utils/validations";
import { mockMetadataResponseData } from "../../mocks/mockResponseData";

const hospitalCapacityParam = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity")!;
const vaccineParam = mockMetadataResponseData.parameters.find(p => p.id === "vaccine")!;

describe("numericValueInvalid", () => {
  it("should return false for valid numeric values", () => {
    expect(numericValueInvalid("10", hospitalCapacityParam)).toBe(false);
    expect(numericValueInvalid("1", hospitalCapacityParam)).toBe(false);
  });

  it("should return true for negative / zero numeric values", () => {
    expect(numericValueInvalid("-1", hospitalCapacityParam)).toBe(true);
    expect(numericValueInvalid("0", hospitalCapacityParam)).toBe(true);
  });

  it("should return true for non-numeric values", () => {
    expect(numericValueInvalid("abc", hospitalCapacityParam)).toBe(true);
    expect(numericValueInvalid("", hospitalCapacityParam)).toBe(true);
  });

  it("should return false for non-numeric parameters", () => {
    expect(numericValueInvalid("10", vaccineParam)).toBe(false);
  });
});

describe("numericValueIsOutOfRange", () => {
  const parameterValueSet = {
    country: "ARG",
  };

  it("should return false for valid numeric values within range", () => {
    expect(numericValueIsOutOfRange("33801", hospitalCapacityParam, parameterValueSet)).toBe(false);
  });

  it("should return true for numeric values below the minimum range", () => {
    expect(numericValueIsOutOfRange("100", hospitalCapacityParam, parameterValueSet)).toBe(true);
  });

  it("should return true for numeric values above the maximum range", () => {
    expect(numericValueIsOutOfRange("999999999", hospitalCapacityParam, parameterValueSet)).toBe(true);
  });

  it("should return false for empty or undefined values or non-numeric parameters", () => {
    expect(numericValueIsOutOfRange("", hospitalCapacityParam, parameterValueSet)).toBe(false);
    expect(numericValueIsOutOfRange(undefined, hospitalCapacityParam, parameterValueSet)).toBe(false);
  });

  it("should return false for non-numeric parameters", () => {
    expect(numericValueIsOutOfRange("100", vaccineParam, parameterValueSet)).toBe(false);
  });
});
