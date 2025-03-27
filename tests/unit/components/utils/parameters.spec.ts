import { paramOptsToSelectOpts } from "@/components/utils/parameters";

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
