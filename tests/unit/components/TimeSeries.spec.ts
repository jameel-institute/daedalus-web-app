import { afterAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockPinia, mockedMetadata } from "@/tests/unit/mocks/mockPinia";
import sampleResultsResponse from "@/mocks/responses/results.json";
import TimeSeries from "@/components/TimeSeries.vue";

const seriesId = mockedMetadata.results.time_series[0].id;
const stubs = {
  CIcon: true,
};
const plugins = [mockPinia(
  { currentScenario: { result: { data: sampleResultsResponse.data } } },
)];
const props = { seriesId, index: 0, openAccordions: mockedMetadata.results.time_series.map(({ id }) => id) };

const mockSetSize = vi.fn();
vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      setSize: mockSetSize,
      showResetZoom: vi.fn(),
    }),
    _modules: actual._modules,
    win: actual.win,
    Pointer: actual.Pointer,
  };
});

describe("time series", () => {
  it("should render the time series chart container", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    const chart = component.find(`#${seriesId}-container`);
    expect(chart.exists()).toBe(true);
  });

  it("should emit toggleOpen when the accordion header is clicked", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    const accordionHeader = component.findComponent({ name: "CAccordionHeader" });
    await accordionHeader.trigger("click");

    await component.vm.$nextTick();
    expect(component.emitted("toggleOpen")).toBeTruthy();
  });

  it("should resize the chart when accordions are opened or closed", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    const chartContainer = component.find(`#${seriesId}-container`);
    const initialHeight = Number.parseInt(chartContainer.element.style.height);

    // All other accordions are closed, outside this component, changing the 'openAccordions' prop
    await component.setProps({ openAccordions: [seriesId] });

    await component.vm.$nextTick();
    expect(mockSetSize).toHaveBeenCalled();
    const newHeight = Number.parseInt(chartContainer.element.style.height);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  afterAll(() => {
    vi.clearAllMocks();
  });
});
