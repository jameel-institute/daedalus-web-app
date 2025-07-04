import { mockMetadataResponseData } from "../mocks/mockResponseData";

const hospitalCapacityParameter = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity");
const vaccineParameter = mockMetadataResponseData.parameters.find(p => p.id === "vaccine");

describe("useComparisonValidation composable", () => {
  it("should return correct boolean outputs for a numeric parameter", () => {
    const scenariosToCompareAgainstBaseline = ref<Array<string>>(["1"]);
    const { tooFewScenarios, tooManyScenarios, numericInvalid, invalid } = useComparisonValidation(scenariosToCompareAgainstBaseline, hospitalCapacityParameter);

    scenariosToCompareAgainstBaseline.value = [];
    expect(invalid.value).toBe(true);
    expect(tooFewScenarios.value).toBe(true);

    scenariosToCompareAgainstBaseline.value = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
    expect(invalid.value).toBe(true);
    expect(tooManyScenarios.value).toBe(true);

    scenariosToCompareAgainstBaseline.value = ["1"];
    expect(invalid.value).toBe(false);

    scenariosToCompareAgainstBaseline.value = ["1", "NaN"];
    expect(invalid.value).toBe(true);
    expect(numericInvalid.value).toBe(true);

    scenariosToCompareAgainstBaseline.value = ["1", "-1"];
    expect(invalid.value).toBe(true);
    expect(numericInvalid.value).toBe(true);
  });

  it("should return correct boolean outputs for a non-numeric parameter", () => {
    const scenariosToCompareAgainstBaseline = ref<Array<string>>(["1"]);
    const { tooFewScenarios, tooManyScenarios, invalid } = useComparisonValidation(scenariosToCompareAgainstBaseline, vaccineParameter);

    scenariosToCompareAgainstBaseline.value = [];
    expect(invalid.value).toBe(true);
    expect(tooFewScenarios.value).toBe(true);

    scenariosToCompareAgainstBaseline.value = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
    expect(invalid.value).toBe(true);
    expect(tooManyScenarios.value).toBe(true);

    scenariosToCompareAgainstBaseline.value = ["1", "NaN"];
    expect(invalid.value).toBe(false);

    scenariosToCompareAgainstBaseline.value = ["1", "-1"];
    expect(invalid.value).toBe(false);
  });
});
