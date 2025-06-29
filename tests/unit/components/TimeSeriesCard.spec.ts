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

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      getOptions: actual.default.getOptions,
      chart: () => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
        showResetZoom: vi.fn(),
      }),
      charts: actual.default.charts,
      _modules: actual.default._modules,
      win: actual.default.win,
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

    seriesIds.forEach((seriesId) => {
      const container = component.find(`#${seriesId}-container`);
      expect(container).not.toBeNull();
      expect(container.classes()).not.toContain("hide-tooltips");
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
});
