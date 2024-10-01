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
const mockDestroy = vi.fn();
vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: mockDestroy,
      setSize: mockSetSize,
      showResetZoom: vi.fn(),
    }),
    charts: actual.charts,
    _modules: actual._modules,
    win: actual.win,
    Pointer: actual.Pointer,
  };
});

describe("time series", () => {
  it("should render the correct label for the time series, and the chart container", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    expect(component.text()).toContain(mockedMetadata.results.time_series[0].label);

    const chartContainer = component.find(`#${seriesId}-container`);
    expect(chartContainer.exists()).toBe(true);
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

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });
});
