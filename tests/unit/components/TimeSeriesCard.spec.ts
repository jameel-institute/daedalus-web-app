import { emptyScenario, mockedMetadata, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import TimeSeriesCard from "~/components/TimeSeriesCard.client.vue";
import { mockResultResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { ScenarioResultData } from "~/types/apiResponseTypes";

const seriesIds = mockedMetadata.results.time_series.map(series => series.id);
const stubs = {
  CIcon: true,
};
const plugins = [mockPinia(
  {
    currentScenario: {
      ...emptyScenario,
      parameters: {
        country: "USA",
      },
      result: {
        data: mockResultResponseData as ScenarioResultData,
        fetchError: undefined,
        fetchStatus: "success",
      },
    },
  },
)];

const mockReset = vi.fn();
const mockOnContainerMouseLeave = vi.fn();
const mockOnMouseOver = vi.fn();

vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: vi.fn(),
      setSize: vi.fn(),
      showResetZoom: vi.fn(),
      index: 0,
    }),
    charts: [{
      pointer: {
        reset: vi.fn(() => mockReset()),
        onContainerMouseLeave: vi.fn(() => mockOnContainerMouseLeave()),
      },
      hoverPoint: { x: 1, y: 99 },
      series: [{
        getValidPoints: () => [{
          x: 1,
          y: 2,
          onMouseOver: vi.fn(() => mockOnMouseOver()),
        }],
      }],
    }],
    _modules: actual._modules,
    win: actual.win,
    wrap: actual.wrap,
    Pointer: actual.Pointer,
  };
});

describe("time series", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the correct list of time series", async () => {
    const component = await mountSuspended(TimeSeriesCard, { global: { stubs, plugins } });

    seriesIds.forEach((seriesId) => {
      const container = component.find(`#${seriesId}-container`);
      expect(container).not.toBeNull();
    });
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

  it("when the mouse leaves a time series, or it is closed, charts should be reset", async () => {
    const component = await mountSuspended(TimeSeriesCard, { global: { stubs, plugins } });

    const timeSeriesGroups = component.findAllComponents({ name: "TimeSeriesGroup.client" });
    expect(timeSeriesGroups.length).toBe(4);
    timeSeriesGroups.forEach((timeSeriesComponent) => {
      expect(timeSeriesComponent.props().open).toBe(true);
    });

    const timeSeries = component.findAllComponents({ name: "TimeSeries.client" });
    expect(timeSeries.length).toBe(8);

    // Close the first time series group by toggling the accordion
    const accordionHeaderComponent = timeSeriesGroups[0].findComponent({ name: "CAccordionHeader" });
    await accordionHeaderComponent.trigger("click");

    await nextTick();

    expect(timeSeriesGroups[0].props().open).toBe(false);
    expect(timeSeriesGroups[1].props().open).toBe(true);
    expect(timeSeriesGroups[2].props().open).toBe(true);
    expect(timeSeriesGroups[3].props().open).toBe(true);

    vi.advanceTimersByTime(1000);
    await nextTick();

    // All 8 time series charts should have been reset by the toggling of the accordion
    expect(mockReset).toHaveBeenCalledTimes(8);

    timeSeries[0].trigger("mousemove");

    // mousemove should trigger the tooltips and crosshairs to be synchronize
    expect(mockOnMouseOver).toHaveBeenCalledTimes(8);
    // The onContainerMouseLeave function should not have been called after mousemove
    expect(mockOnContainerMouseLeave).not.toHaveBeenCalled();

    timeSeries[0].trigger("mouseleave");
    vi.advanceTimersByTime(1000);

    // All 8 time series charts should have been reset (hide all tooltips and crosshairs) once more
    // by the mouse leaving one of the time series
    expect(mockReset).toHaveBeenCalledTimes(8 * 2);
  });
});
