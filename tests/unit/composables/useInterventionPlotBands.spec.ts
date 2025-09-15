import type { DisplayInfo } from "~/types/apiResponseTypes";
import type { TimeSeriesIntervention } from "~/types/dataTypes";

const mockRemovePlotBand = vi.fn();
const mockAddPlotBand = vi.fn();
const mockToggleContextMenuButton = vi.fn();

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
const red = "rgb(255,0,0)";
const green = "rgb(0,255,0)";
const labelText = "This intervention has been granted a label";

describe("useInterventionsPlotBands", () => {
  it("should compute interventions plot bands and update x axis correctly", async () => {
    let expectedCallsToAddPlotBand = 0;
    let expectedCallsToRemovePlotBand = 0;
    let expectedCallsToToggleButton = 0;
    const intvn1 = {
      id: "response-111.222-444.555",
      color: red,
      label: labelText,
      start: 111.222,
      end: 444.555,
    };
    const intvn1plotBandExpectation = expect.objectContaining({
      id: "response-111.222-444.555",
      from: 111,
      to: 445,
      color: "rgba(255,0,0,0.3)",
      label: expect.objectContaining({
        text: labelText,
        style: expect.objectContaining({ color: red }),
      }),
    });
    const intvn2 = {
      id: "response-666.7-888.9",
      color: green,
      label: "",
      start: 666.7,
      end: 888.9,
    };
    const intvn2plotBandExpectation = expect.objectContaining({
      id: "response-666.7-888.9",
      from: 667,
      to: 889,
      color: "rgba(0,255,0,0.3)",
      label: expect.objectContaining({
        text: "",
        style: expect.objectContaining({ color: green }),
      }),
    });

    const timeSeriesMetadata = ref<DisplayInfo>(prevalenceTimeSeriesMetadata);
    const interventions = ref<Array<TimeSeriesIntervention> | undefined>(undefined);
    const xAxis = ref({
      removePlotBand: vi.fn(arg => mockRemovePlotBand(arg)),
      addPlotBand: vi.fn(arg => mockAddPlotBand(arg)),
    } as unknown as Highcharts.Axis);

    const { initialInterventionsPlotBands } = useInterventionPlotBands(
      timeSeriesMetadata,
      interventions,
      xAxis,
      mockToggleContextMenuButton,
    );

    expect(initialInterventionsPlotBands).toEqual([]);
    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    interventions.value = [];
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
    expect(mockToggleContextMenuButton).not.toHaveBeenCalled();

    interventions.value = [intvn1];
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([intvn1plotBandExpectation]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    // The context menu button is disabled now, because plot bands (with labels) are now shown.
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([false]);

    timeSeriesMetadata.value = vaccinationTimeSeriesMetadata; // Configured not to show plot bands.
    expectedCallsToRemovePlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockRemovePlotBand.mock.lastCall).toEqual([intvn1.id]);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    // The context menu button is enabled now, because no plot bands are now shown.
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([true]);

    timeSeriesMetadata.value = prevalenceTimeSeriesMetadata; // Configured to show plot bands.
    expectedCallsToAddPlotBand++;
    expectedCallsToToggleButton++;
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([intvn1plotBandExpectation]);
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
    expect(mockToggleContextMenuButton.mock.lastCall).toEqual([false]);

    interventions.value = [intvn1, intvn2];
    expectedCallsToAddPlotBand++; // Only one _new_ plot band - we should keep the first plot band.
    await nextTick();

    expect(mockRemovePlotBand).toHaveBeenCalledTimes(expectedCallsToRemovePlotBand);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(expectedCallsToAddPlotBand);
    expect(mockAddPlotBand.mock.lastCall).toEqual([intvn2plotBandExpectation]);
    // No relevant change to plot band labels, so no toggling of context menu button.
    expect(mockToggleContextMenuButton).toHaveBeenCalledTimes(expectedCallsToToggleButton);
  });
});
