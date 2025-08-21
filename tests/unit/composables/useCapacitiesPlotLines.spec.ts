import Highcharts from "highcharts/esm/highcharts";
import type { ScenarioCapacity } from "~/types/resultTypes";

const mockRemovePlotLine = vi.fn();
const mockAddPlotLine = vi.fn();

vi.mock("highcharts/esm/highcharts", async () => {
  return {
    default: {
      chart: () => ({
        yAxis: [{
          removePlotLine: vi.fn(arg => mockRemovePlotLine(arg)),
          addPlotLine: vi.fn(arg => mockAddPlotLine(arg)),
        }],
      }),
    },
  };
});

describe("useCapacitiesPlotLines", () => {
  it("should compute capacities plot lines and update y axis correctly", async () => {
    let expectedCallsToAddPlotLine = 0;
    let expectedCallsToRemovePlotLine = 0;

    const showCapacities = ref(true);
    const capacities = ref<Array<ScenarioCapacity> | undefined>(undefined);
    const chart = ref(Highcharts.chart("", {}));

    const { capacitiesPlotLines, minRange } = useCapacitiesPlotLines(showCapacities, capacities, chart);

    expect(capacitiesPlotLines.value).toEqual([]);
    expect(minRange.value).toBeUndefined();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    capacities.value = [];
    await nextTick();

    expect(capacitiesPlotLines.value).toEqual([]);
    expect(minRange.value).toBeUndefined();
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).not.toHaveBeenCalled();

    capacities.value = [{
      id: "hospital_capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(capacitiesPlotLines.value).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      value: 2000,
    })]);
    expect(minRange.value).toBe(2000);
    expect(mockRemovePlotLine).not.toHaveBeenCalled();
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      value: 2000,
    })]);

    showCapacities.value = false;
    expectedCallsToRemovePlotLine++;
    await nextTick();

    expect(capacitiesPlotLines.value).toEqual([]);
    expect(minRange.value).toBeUndefined();
    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockRemovePlotLine.mock.lastCall).toEqual(["hospital_capacity-2000"]);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);

    showCapacities.value = true;
    expectedCallsToAddPlotLine++;
    await nextTick();

    expect(capacitiesPlotLines.value).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      value: 2000,
    })]);
    expect(minRange.value).toBe(2000);
    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "hospital_capacity-2000",
      value: 2000,
    })]);

    capacities.value = [{
      id: "icu_capacity",
      value: 2500,
    }, {
      id: "hospital_capacity",
      value: 2000,
    }];
    expectedCallsToAddPlotLine++; // Only one _new_ plot line - we should keep the first plot line.
    await nextTick();

    expect(capacitiesPlotLines.value).toHaveLength(2);
    expect(capacitiesPlotLines.value).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "icu_capacity-2500",
        value: 2500,
      }),
      expect.objectContaining({
        id: "hospital_capacity-2000",
        value: 2000,
      }),
    ]));
    expect(minRange.value).toBe(2500);
    expect(mockRemovePlotLine).toHaveBeenCalledTimes(expectedCallsToRemovePlotLine);
    expect(mockAddPlotLine).toHaveBeenCalledTimes(expectedCallsToAddPlotLine);
    expect(mockAddPlotLine.mock.lastCall).toEqual([expect.objectContaining({
      id: "icu_capacity-2500",
      value: 2500,
    })]);
  });
});
