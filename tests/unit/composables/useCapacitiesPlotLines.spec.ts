import type { Metadata } from "~/types/apiResponseTypes";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import { mockPinia } from "../mocks/mockPinia";
import { setActivePinia } from "pinia";

const mockRemovePlotLine = vi.fn();
const mockAddPlotLine = vi.fn();
const mockUpdate = vi.fn();

const metadata = {
  ...mockMetadataResponseData,
  results: {
    ...mockMetadataResponseData.results,
    capacities: [
      ...mockMetadataResponseData.results.capacities,
      {
        id: "icu_capacity",
        label: "ICU capacity",
        description: "Number of ICU beds",
      },
    ],
  },
} as Metadata;

describe("useCapacitiesPlotLines", () => {
  it("should compute capacities plot lines and update y axis correctly", async () => {
    setActivePinia(mockPinia({ metadata }, false, { stubActions: false }));
    const store = useAppStore();
    store.currentScenario = {
      runId: "scenario_1",
      result: {
        data: {
          capacities: undefined,
        },
      },
    };
    store.metadata = {
      ...mockMetadataResponseData,
      results: {
        ...mockMetadataResponseData.results,
        capacities: [
          ...mockMetadataResponseData.results.capacities,
          {
            id: "icu_capacity",
            label: "ICU capacity",
            description: "Number of ICU beds",
          },
        ],
      },
    };

    let expectedCallsToAddPlotLine = 0;
    let expectedCallsToRemovePlotLine = 0;

    const showCapacities = ref(true);
    const yAxis = ref({
      update: vi.fn(arg => mockUpdate(arg)),
      removePlotLine: vi.fn(arg => mockRemovePlotLine(arg)),
      addPlotLine: vi.fn(arg => mockAddPlotLine(arg)),
    } as unknown as Highcharts.Axis);

    const { initialCapacitiesPlotLines, initialMinRange } = useCapacitiesPlotLines(
      showCapacities,
      yAxis,
      store.currentScenario,
    );

    expect(initialCapacitiesPlotLines).toEqual([]);
    expect(initialMinRange).toBeUndefined();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    store.currentScenario.result.data.capacities = [];
    await nextTick();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    store.currentScenario.result.data.capacities = [{
      id: "hospital_capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(mockUpdate).toHaveBeenCalledWith({ minRange: 2000 });
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000-scenario_1",
      label: expect.objectContaining({ text: "Hospital surge capacity: 2,000" }),
      value: 2000,
    })]);

    showCapacities.value = false;
    expectedCallsToRemovePlotLine++;
    await nextTick();

    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockRemovePlotLine.mock.lastCall).toEqual(["hospital_capacity-2000-scenario_1"]);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);

    showCapacities.value = true;
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000-scenario_1",
      label: expect.objectContaining({ text: "Hospital surge capacity: 2,000" }),
      value: 2000,
    })]);

    store.currentScenario.result.data.capacities = [{
      id: "icu_capacity",
      value: 2500,
    }, {
      id: "hospital_capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++; // Only one _new_ plot line - we should keep the first plot line.
    await nextTick();

    expect(mockUpdate).toHaveBeenCalledWith({ minRange: 2500 });
    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "icu_capacity-2500-scenario_1",
      label: expect.objectContaining({ text: "ICU capacity: 2,500" }),
      value: 2500,
    })]);
  });
});
