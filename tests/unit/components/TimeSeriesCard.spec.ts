import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import TimeSeriesCard from "~/components/TimeSeriesCard.client.vue";
import { mockResultResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { ScenarioResultData } from "~/types/apiResponseTypes";

const stubs = {
  CIcon: true,
};
const plugins = [mockPinia({
  currentScenario: {
    ...emptyScenario,
    runId: "successfulResponseRunId",
    parameters: {
      country: "USA",
    },
    result: {
      data: mockResultResponseData as ScenarioResultData,
      fetchError: undefined,
      fetchStatus: "success",
    },
  },
}, true, { stubActions: false })];

const mockReset = vi.fn();
const mockOnContainerMouseLeave = vi.fn();
const mockOnMouseOver = vi.fn();
const mockRemovePlotBand = vi.fn();
const mockAddPlotBand = vi.fn();

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();
  const series = {
    options: {
      custom: {
        scenarioId: "successfulResponseRunId",
        showInterventions: true,
      },
    },
    getValidPoints: () => [{
      x: 1,
      y: 2,
      onMouseOver: vi.fn(() => mockOnMouseOver()),
    }],
  };

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
        showResetZoom: vi.fn(),
        series: [series],
        pointer: {
          reset: vi.fn(() => mockReset()),
          onContainerMouseLeave: vi.fn(() => mockOnContainerMouseLeave()),
        },
        hoverPoint: { x: 1, y: 99, series },
        xAxis: [{
          removePlotBand: vi.fn(arg => mockRemovePlotBand(arg)),
          addPlotBand: vi.fn(arg => mockAddPlotBand(arg)),
        }],
      }),
      win: actual.default.win,
      wrap: actual.default.wrap,
      Pointer: actual.default.Pointer,
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

describe("time series", () => {
  it("should render the correct list of time series", async () => {
    const component = await mountSuspended(TimeSeriesCard, { global: { stubs, plugins } });

    const infectionsContainer = component.find("#time-series-0");
    expect(infectionsContainer.exists()).toBe(true);
    const hospitalisationsContainer = component.find("#time-series-1");
    expect(hospitalisationsContainer.exists()).toBe(true);
    const deathsContainer = component.find("#time-series-2");
    expect(deathsContainer.exists()).toBe(true);
    const vaccinationsContainer = component.find("#time-series-3");
    expect(vaccinationsContainer.exists()).toBe(true);
    expect(component.text()).toContain("Prevalence");
    expect(component.text()).toContain("Hospital demand");
    expect(component.text()).toContain("Dead");
    expect(component.text()).toContain("Vaccinated");
  });

  it("when an accordion's open state is toggled, it should switch state without affecting other accordions' states", async () => {
    const component = await mountSuspended(TimeSeriesCard, { global: { stubs, plugins } });

    const timeSeriesGroups = component.findAllComponents({ name: "TimeSeriesGroup.client" });
    expect(timeSeriesGroups.length).toBe(4);
    timeSeriesGroups.forEach((timeSeriesComponent) => {
      expect(timeSeriesComponent.props().open).toBe(true);
    });

    const firstAccordionHeader = component.find(".accordion-header");
    await firstAccordionHeader.trigger("click");

    // Check the open prop of the first TimeSeries component
    expect(timeSeriesGroups[0].props().open).toBe(false);
    expect(timeSeriesGroups[1].props().open).toBe(true);
    expect(timeSeriesGroups[2].props().open).toBe(true);

    await firstAccordionHeader.trigger("click");
    timeSeriesGroups.forEach((timeSeriesComponent) => {
      expect(timeSeriesComponent.props().open).toBe(true);
    });
  });

  it("when a time series is closed or mouse leaves it, charts should be reset; tooltips synchronize on mousemove", async () => {
    const component = await mountSuspended(TimeSeriesCard, { global: { stubs, plugins } });

    const timeSeriesGroups = component.findAllComponents({ name: "TimeSeriesGroup.client" });
    expect(timeSeriesGroups.length).toBe(4);
    timeSeriesGroups.forEach((timeSeriesGroup) => {
      expect(timeSeriesGroup.props().open).toBe(true);
    });

    const timeSeries = component.findAllComponents({ name: "TimeSeries.client" });
    const expectedNumberOfTimeSeries = 4;
    expect(timeSeries.length).toBe(expectedNumberOfTimeSeries);
    expect(component.find("#time-series-0").element.style._values["z-index"]).toEqual(7);
    expect(component.find("#time-series-1").element.style._values["z-index"]).toEqual(6);
    expect(component.find("#time-series-2").element.style._values["z-index"]).toEqual(5);
    expect(component.find("#time-series-3").element.style._values["z-index"]).toEqual(4);

    // Close the first time series group by toggling the accordion
    const accordionHeaderComponent = timeSeriesGroups[0].findComponent({ name: "CAccordionHeader" });
    await accordionHeaderComponent.trigger("click");
    await nextTick();

    expect(timeSeriesGroups[0].props().open).toBe(false);
    expect(timeSeriesGroups[1].props().open).toBe(true);
    expect(timeSeriesGroups[2].props().open).toBe(true);
    expect(timeSeriesGroups[3].props().open).toBe(true);
    // All time series charts should have been reset (hide all tooltips and crosshairs)
    // by the toggling of the accordion
    expect(mockReset).toHaveBeenCalledTimes(expectedNumberOfTimeSeries);

    const prevalenceTimeSeries = component.find("#time-series-0");

    // Hover on the time series
    prevalenceTimeSeries.trigger("mousemove");
    await nextTick();

    // mousemove should trigger the tooltips and crosshairs to be synchronized
    expect(mockOnMouseOver).toHaveBeenCalledTimes(expectedNumberOfTimeSeries);
    // The onContainerMouseLeave function should not have been called after mousemove
    expect(mockOnContainerMouseLeave).not.toHaveBeenCalled();
    const numberOfTimeSeriesThatEnablePlotBands = 2;
    expect(mockRemovePlotBand).toHaveBeenCalledTimes(numberOfTimeSeriesThatEnablePlotBands);
    expect(mockAddPlotBand).toHaveBeenCalledTimes(numberOfTimeSeriesThatEnablePlotBands);
    expect(mockAddPlotBand).toHaveBeenCalledWith(expect.objectContaining({
      label: expect.objectContaining({
        text: "Intervention days 30–600", // Has label text because series is hovered.
      }),
    }));

    const accordionBodyComponent = timeSeriesGroups[0].findComponent({ name: "CAccordionBody" });
    accordionBodyComponent.trigger("mouseleave");

    // All time series charts should have been reset (hide all tooltips and crosshairs)
    // once more (hence `* 2`, for this second event) by the mouse leaving one of the time series
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledTimes(expectedNumberOfTimeSeries * 2);
      expect(mockRemovePlotBand).toHaveBeenCalledTimes(numberOfTimeSeriesThatEnablePlotBands * 2);
      expect(mockAddPlotBand).toHaveBeenCalledTimes(numberOfTimeSeriesThatEnablePlotBands * 2);
      expect(mockAddPlotBand).toHaveBeenCalledWith(expect.objectContaining({
        label: expect.objectContaining({
          text: "", // No label text because series is not hovered.
        }),
      }));
    });
  });
});
