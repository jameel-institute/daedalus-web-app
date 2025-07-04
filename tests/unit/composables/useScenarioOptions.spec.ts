import type { Parameter } from "~/types/parameterTypes";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import { emptyScenario } from "../mocks/mockPinia";

beforeAll(() => {
  const store = useAppStore();
  store.currentScenario = { ...structuredClone(emptyScenario), parameters: { vaccine: "none", hospital_capacity: "12345" } };
});

describe("useScenarioOptions composable", () => {
  it("should return correct baselineOption, predefinedOptions, and predefinedSelectOptions when no axis has been selected", () => {
    const parameterAxis = ref<Parameter>();
    const { baselineOption, predefinedOptions, predefinedSelectOptions } = useScenarioOptions(parameterAxis);

    expect(baselineOption.value).toBe(undefined);
    expect(predefinedOptions.value).toEqual([]);
    expect(predefinedSelectOptions.value).toEqual([]);
  });

  it("should return correct baselineOption, predefinedOptions, and predefinedSelectOptions when a parameter with options has been selected", () => {
    const parameterAxis = ref<Parameter>();
    const { baselineOption, predefinedOptions, predefinedSelectOptions } = useScenarioOptions(parameterAxis);

    parameterAxis.value = mockMetadataResponseData.parameters.find(p => p.id === "vaccine");
    expect(baselineOption.value).toEqual({ id: "none", label: "None", description: expect.any(String) });
    expect(predefinedOptions.value).toHaveLength(3);
    expect(predefinedOptions.value).toEqual(expect.arrayContaining([
      { id: "low", label: "Low", description: expect.any(String) },
      { id: "medium", label: "Medium", description: expect.any(String) },
      { id: "high", label: "High", description: expect.any(String) },
    ]));
    expect(predefinedSelectOptions.value).toHaveLength(3);
    expect(predefinedSelectOptions.value).toEqual(expect.arrayContaining([
      { value: "low", label: "Low", description: expect.any(String) },
      { value: "medium", label: "Medium", description: expect.any(String) },
      { value: "high", label: "High", description: expect.any(String) },
    ]));
  });

  it("should return correct baselineOption, predefinedOptions, and predefinedSelectOptions when a numeric parameter has been selected", () => {
    const parameterAxis = ref<Parameter>();
    const { baselineOption, predefinedOptions, predefinedSelectOptions } = useScenarioOptions(parameterAxis);

    parameterAxis.value = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity");
    expect(baselineOption.value).toEqual({ id: "12345", label: "12,345", description: "" });
    expect(predefinedOptions.value).toHaveLength(0);
    expect(predefinedSelectOptions.value).toHaveLength(0);
  });
});
