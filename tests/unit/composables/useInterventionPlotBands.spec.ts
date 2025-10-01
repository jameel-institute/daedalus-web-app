import type { DisplayInfo } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { setActivePinia } from "pinia";
import { plotBandsDefaultColor } from "~/components/Charts/utils/timeSeriesCharts";

const mockRemovePlotBand = vi.fn();
const mockAddPlotBand = vi.fn();
const mockToggleContextMenuButton = vi.fn();
const xAxis = ref({
  removePlotBand: vi.fn(arg => mockRemovePlotBand(arg)),
  addPlotBand: vi.fn(arg => mockAddPlotBand(arg)),
} as unknown as Highcharts.Axis);
const prevalenceTimeSeriesMetadata = {
  id: "prevalence",
  label: "Prevalence",
  description: "Prevalence of the disease",
};
const vaccinationTimeSeriesMetadata = {
  id: "vaccinated",
  label: "Vaccinations",
  description: "Vaccination coverage over time",
};
const plotBandsDefaultColorWithAlpha = "rgba(51,187,238,0.3)";
const intervention1 = {
  id: "response",
  start: 111.222,
  end: 444.555,
};
const intervention2 = {
  id: "response",
  start: 666.7,
  end: 888.9,
};

describe("useInterventionsPlotBands", () => {
  it("should compute interventions plot bands and update x axis correctly when dealing with a single scenario", async () => {
    setActivePinia(mockPinia());
    const store = useAppStore();
    store.currentScenario = {
      ...emptyScenario,
      runId: "scenario_1",
    };

    let expectedCallsToAddPlotBand = 0;
    let expectedCallsToRemovePlotBand = 0;
    let expectedCallsToToggleButton = 0;

    const timeSeriesMetadata = ref<DisplayInfo>(prevalenceTimeSeriesMetadata);
    const synchPoint = ref<Highcharts.Point>();

    const { initialInterventionsPlotBands } = useInterventionPlotBands(
      synchPoint,
      timeSeriesMetadata,
      xAxis,
      mockToggleContextMenuButton,
      store.currentScenario,
    );

    expect(initialInterventionsPlotBands).toEqual([]);
    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    store.currentScenario.result = { data: { interventions: [] } };
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    store.currentScenario.result.data.interventions = [{ id: "irrelevant_intervention_type", start: 1, end: 2 }];
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    store.currentScenario.result.data.interventions = [intervention1];
    expectedCallsToAddPlotBand++;
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([expect.objectContaining({
      id: "scenario_1-111.222-444.555-false",
      from: 111,
      to: 445,
      color: plotBandsDefaultColorWithAlpha,
      label: expect.objectContaining({
        text: "",
      }),
    })]);
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    // Hover over a chart that doesn't show interventions - no change.
    synchPoint.value = { series: { options: { custom: { showInterventions: false } } } };
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    // Hover over a chart that does show interventions - update plot bands to show labels, and toggle off the menu button.
    synchPoint.value = { series: { options: { custom: { showInterventions: true } } } };
    expectedCallsToRemovePlotBand++;
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockRemovePlotBand.mock.lastCall).toEqual(["scenario_1-111.222-444.555-false"]);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([expect.objectContaining({
      id: "scenario_1-111.222-444.555-true",
      from: 111,
      to: 445,
      color: plotBandsDefaultColorWithAlpha,
      label: expect.objectContaining({
        text: "Intervention days 111–445",
        style: expect.objectContaining({ color: plotBandsDefaultColor }),
      }),
    })]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    // The context menu button is disabled now, because plot bands (with labels) are now shown.
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([false]);

    // No longer hovering over any chart - remove labels, and toggle the menu button back on.
    synchPoint.value = undefined;
    expectedCallsToRemovePlotBand++;
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockRemovePlotBand.mock.lastCall).toEqual(["scenario_1-111.222-444.555-true"]);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([expect.objectContaining({
      id: "scenario_1-111.222-444.555-false",
      from: 111,
      to: 445,
      color: plotBandsDefaultColorWithAlpha,
      label: expect.objectContaining({
        text: "",
      }),
    })]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    // The context menu button is enabled now, because no plot band labels
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([true]);

    synchPoint.value = { series: { options: { custom: { showInterventions: true } } } };
    expectedCallsToRemovePlotBand++;
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();
    // Switching to a time series that doesn't show interventions removes all plot bands
    // even when the hovered chart's time series would show them.
    timeSeriesMetadata.value = vaccinationTimeSeriesMetadata;
    expectedCallsToRemovePlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockRemovePlotBand.mock.lastCall).toEqual(["scenario_1-111.222-444.555-true"]);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([true]);

    // Switch to a time series that is configured to show plot bands.
    timeSeriesMetadata.value = prevalenceTimeSeriesMetadata;
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand); // Nothing to remove
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([expect.objectContaining({
      id: "scenario_1-111.222-444.555-true",
      from: 111,
      to: 445,
      color: plotBandsDefaultColorWithAlpha,
      label: expect.objectContaining({
        text: "Intervention days 111–445",
      }),
    })]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([false]);

    store.currentScenario.result.data.interventions = [intervention1, intervention2];
    expectedCallsToAddPlotBand++; // Only one _new_ plot band - we should keep the first plot band.
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand); // Nothing is removed
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([expect.objectContaining({
      id: "scenario_1-666.7-888.9-true",
      from: 667,
      to: 889,
      color: plotBandsDefaultColorWithAlpha,
      label: expect.objectContaining({
        text: "Intervention days 667–889",
        style: expect.objectContaining({ color: plotBandsDefaultColor }),
      }),
    })]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
  });

  it("should compute interventions plot bands correctly when dealing with multiple scenarios", async () => {
    setActivePinia(mockPinia());
    const store = useAppStore();
    const scenario2 = {
      ...emptyScenario,
      runId: "scenario_2",
      result: {
        data: {
          interventions: [intervention1, intervention2],
        },
      },
    };
    store.currentComparison = {
      scenarios: [
        { ...emptyScenario, runId: "scenario_1" },
        scenario2,
      ],
    };

    const { initialInterventionsPlotBands } = useInterventionPlotBands(
      ref<Highcharts.Point>({ series: { options: { custom: { showInterventions: true } } } }),
      ref<DisplayInfo>(prevalenceTimeSeriesMetadata),
      xAxis,
      mockToggleContextMenuButton,
      store.currentComparison.scenarios[1],
    );

    const expectedColorOfSecondTimeSeries = "rgb(238,119,51)"; // timeSeriesColors[1]
    const colorWithAlpha = "rgba(238,119,51,0.3)";

    expect(initialInterventionsPlotBands).toEqual([
      expect.objectContaining({
        id: "scenario_2-111.222-444.555-true",
        from: 111,
        to: 445,
        color: colorWithAlpha,
        label: expect.objectContaining({
          text: "Intervention days 111–445",
          style: expect.objectContaining({ color: expectedColorOfSecondTimeSeries }),
        }),
      }),
      expect.objectContaining({
        id: "scenario_2-666.7-888.9-true",
        from: 667,
        to: 889,
        color: colorWithAlpha,
        label: expect.objectContaining({
          text: "Intervention days 667–889",
          style: expect.objectContaining({ color: expectedColorOfSecondTimeSeries }),
        }),
      }),
    ]);
  });
});
