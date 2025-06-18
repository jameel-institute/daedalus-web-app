import { paramOptsToSelectOpts, sortOptions } from "@/components/utils/parameters";
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
});
