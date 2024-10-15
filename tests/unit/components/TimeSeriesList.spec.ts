import TimeSeriesList from "@/components/TimeSeriesList.vue";
import { emptyScenario, mockedMetadata, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResultResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
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

vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: vi.fn(),
      setSize: vi.fn(),
      showResetZoom: vi.fn(),
    }),
    charts: actual.charts,
    _modules: actual._modules,
    win: actual.win,
    Pointer: actual.Pointer,
  };
});

describe("time series", () => {
  it("should render the correct list of time series", async () => {
    const component = await mountSuspended(TimeSeriesList, { global: { stubs, plugins } });

    seriesIds.forEach((seriesId) => {
      const container = component.find(`#${seriesId}-container`);
      expect(container).not.toBeNull();
      expect(container.classes()).not.toContain("hide-tooltips");
    });
  });

  it("when an accordion's open state is toggled, it should switch state without affecting other accordions' states", async () => {
    const component = await mountSuspended(TimeSeriesList, { global: { stubs, plugins } });

    const timeSeriesComponents = component.findAllComponents({ name: "TimeSeries" });
    expect(timeSeriesComponents.length).toBe(3);
    timeSeriesComponents.forEach((timeSeriesComponent) => {
      expect(timeSeriesComponent.props().open).toBe(true);
    });

    const firstAccordionHeader = component.find(".accordion-header");
    await firstAccordionHeader.trigger("click");
    await component.vm.$nextTick();

    // Check the open prop of the first TimeSeries component
    expect(timeSeriesComponents[0].props().open).toBe(false);
    expect(timeSeriesComponents[1].props().open).toBe(true);
    expect(timeSeriesComponents[2].props().open).toBe(true);

    await firstAccordionHeader.trigger("click");
    await component.vm.$nextTick();
    timeSeriesComponents.forEach((timeSeriesComponent) => {
      expect(timeSeriesComponent.props().open).toBe(true);
    });
  });
});
