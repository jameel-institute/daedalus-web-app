import type { TimeSeriesCapacity } from "~/types/dataTypes";

const mockRemovePlotLine = vi.fn();
const mockAddPlotLine = vi.fn();
const mockUpdate = vi.fn();

describe("useCapacitiesPlotLines", () => {
  it("should compute capacities plot lines and update y axis correctly", async () => {
    let expectedCallsToAddPlotLine = 0;
    let expectedCallsToRemovePlotLine = 0;

    const showCapacities = ref(true);
    const capacities = ref<Array<TimeSeriesCapacity> | undefined>(undefined);
    const yAxis = ref({
      update: vi.fn(arg => mockUpdate(arg)),
      removePlotLine: vi.fn(arg => mockRemovePlotLine(arg)),
      addPlotLine: vi.fn(arg => mockAddPlotLine(arg)),
    } as unknown as Highcharts.Axis);

    const { initialCapacitiesPlotLines, initialMinRange } = useCapacitiesPlotLines(showCapacities, capacities, yAxis);

    expect(initialCapacitiesPlotLines).toEqual([]);
    expect(initialMinRange).toBeUndefined();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    capacities.value = [];
    await nextTick();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    capacities.value = [{
      id: "hospital_capacity-2000",
      label: "Hospital capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(mockUpdate).toHaveBeenCalledWith({ minRange: 2000 });
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      label: expect.objectContaining({ text: "Hospital capacity: 2,000" }),
      value: 2000,
    })]);

    showCapacities.value = false;
    expectedCallsToRemovePlotLine++;
    await nextTick();

    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockRemovePlotLine.mock.lastCall).toEqual(["hospital_capacity-2000"]);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);

    showCapacities.value = true;
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      label: expect.objectContaining({ text: "Hospital capacity: 2,000" }),
      value: 2000,
    })]);

    capacities.value = [{
      id: "icu_capacity-2500",
      label: "ICU capacity",
      value: 2500,
    }, {
      id: "hospital_capacity-2000",
      label: "Hospital capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++; // Only one _new_ plot line - we should keep the first plot line.
    await nextTick();

    expect(mockUpdate).toHaveBeenCalledWith({ minRange: 2500 });
    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "icu_capacity-2500",
      label: expect.objectContaining({ text: "ICU capacity: 2,500" }),
      value: 2500,
    })]);
  });
});
