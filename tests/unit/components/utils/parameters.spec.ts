import { getRangeForDependentParam, paramOptsToSelectOpts, sortOptions } from "@/components/utils/parameters";
import { TypeOfParameter } from "~/types/parameterTypes";

describe("paramOptsToSelectOpts", () => {
  it("should convert from (metadata) parameter option type, to the option type required for selects", () => {
    const paramOptions = [
      { id: "a", label: "A", description: "Description of A" },
      { id: "b", label: "B", description: undefined },
    ];
    expect(paramOptsToSelectOpts(paramOptions)).toEqual([
      { value: "a", label: "A", description: "Description of A" },
      { value: "b", label: "B", description: "" },
    ]);
  });
});

describe("sortOptions", () => {
  it("should return the same order if parameter is not deemed 'ordered' in its metadata", () => {
    const parameter = {
      id: "myUnorderedParameter",
      ordered: false,
      label: "My Unordered Parameter",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "a", label: "Option A" },
        { id: "b", label: "Option B" },
      ],
    };
    const optionsToSort = ["b", "a"];
    expect(sortOptions(parameter, optionsToSort)).toEqual(["b", "a"]);
  });

  it("should return the correct order if parameter is, in fact, ordered", () => {
    const parameter = {
      id: "myOrderedParameter",
      ordered: true,
      label: "My Ordered Parameter",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "a", label: "Option A" },
        { id: "b", label: "Option B" },
      ],
    };
    const optionsToSort = ["b", "a"];
    expect(sortOptions(parameter, optionsToSort)).toEqual(["a", "b"]);
  });

  it("should handle numeric parameters", () => {
    const parameter = {
      id: "myNumericParameter",
      ordered: false,
      label: "My Numeric Parameter",
      parameterType: TypeOfParameter.Numeric,
    };
    const optionsToSort = ["1", "3", "2"];
    expect(sortOptions(parameter, optionsToSort)).toEqual(["1", "2", "3"]);
  });

  it("should handle semi-ordered parameters by putting 'none' first", () => {
    const parameter = {
      id: "myUnorderedParameter",
      ordered: false,
      label: "My Unordered Parameter",
      parameterType: TypeOfParameter.Select,
      options: [
        { id: "a", label: "Option A" },
        { id: "none", label: "None" },
        { id: "b", label: "Option B" },
      ],
    };
    const optionsToSort = ["b", "none", "a"];
    expect(sortOptions(parameter, optionsToSort)).toEqual(["none", "b", "a"]);
  });
});

describe("getRangeForDependentParam", () => {
  const paramBase = {
    id: "dependentParam",
    ordered: false,
    label: "My Dependent Parameter",
    parameterType: TypeOfParameter.Numeric,
  };

  it("should return the correct range for a dependent parameter", () => {
    const dependentParam = {
      ...paramBase,
      updateNumericFrom: {
        parameterId: "otherParam",
        values: { a: { min: 10, default: 15, max: 20 }, b: { min: 30, default: 35, max: 40 } },
      },
    };
    expect(getRangeForDependentParam(dependentParam, { dependentParam: "20", otherParam: "a" })).toEqual(
      { min: 10, default: 15, max: 20 },
    );
    expect(getRangeForDependentParam(dependentParam, { dependentParam: "20", otherParam: "b" })).toEqual(
      { min: 30, default: 35, max: 40 },
    );
  });

  it("should return undefined if the dependent parameter's value is not in the values map", () => {
    const dependentParam = {
      ...paramBase,
      updateNumericFrom: {
        parameterId: "otherParam",
        values: { a: { min: 10, default: 15, max: 20 }, b: { min: 30, default: 35, max: 40 } },
      },
    };
    const parameterValueSet = { dependentParam: "20", otherParam: "z" };
    expect(getRangeForDependentParam(dependentParam, parameterValueSet)).toBeUndefined();
  });

  it("should return undefined if no dependent parameter is provided", () => {
    const parameterValueSet = { dependentParam: "20", otherParam: "a" };
    expect(getRangeForDependentParam(undefined, parameterValueSet)).toBeUndefined();
  });

  it("should return undefined if no parameter value set is provided", () => {
    expect(getRangeForDependentParam(paramBase, undefined)).toBeUndefined();
  });

  it("should return undefined if the dependent parameter does not have an updateNumericFrom property", () => {
    const parameterValueSet = { dependentParam: "20", otherParam: "a" };
    expect(getRangeForDependentParam(paramBase, parameterValueSet)).toBeUndefined();
  });
});
