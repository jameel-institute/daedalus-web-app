import TimeSeries from "@/components/TimeSeries.vue";
import { emptyScenario, mockedMetadata, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterAll, describe, expect, it, vi } from "vitest";
import { mockResultResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { ScenarioResultData } from "~/types/apiResponseTypes";

const seriesId = mockedMetadata.results.time_series[0].id;
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
const props = {
  seriesId,
  index: 0,
  open: true,
  chartHeightPx: 100,
  minChartHeightPx: 200,
  hideTooltips: false,
};

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
  it("should render the correct label and description for the time series, and render the chart container", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    expect(component.text()).toContain("Prevalence");
    expect(component.text()).toContain("Number of infectious individuals");

    const chartContainer = component.find(`#${seriesId}-container`);
    expect(chartContainer.exists()).toBe(true);
    expect(chartContainer.classes()).not.toContain("hide-tooltips");

    expect(chartContainer.classes()).not.toContain("hide-tooltips");
    await component.setProps({ hideTooltips: true });
    expect(chartContainer.classes()).toContain("hide-tooltips");
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

    await component.setProps({ open: false });
    // Allow enough time for debounce to finish
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockSetSize).toHaveBeenCalled();
    const newHeight = mockSetSize.mock.calls[0][1]; // The second argument to setSize is the new height
    expect(newHeight).toBe(props.minChartHeightPx); // Since props.chartHeightPx is less than props.minChartHeightPx

    await component.setProps({ open: true });
    await component.vm.$nextTick();
    expect(mockSetSize).toHaveBeenCalled();
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("should determine its collapsed state using the 'open' prop", async () => {
    const component = await mountSuspended(TimeSeries, { props: { ...props, open: false }, global: { stubs, plugins } });

    const accordionButton = component.find(".accordion-button");
    expect(accordionButton.classes()).toContain("collapsed");

    await component.setProps({ open: true });
    await component.vm.$nextTick();
    expect(accordionButton.classes()).not.toContain("collapsed");
  });

  afterAll(() => {
    vi.clearAllMocks();
  });
});
