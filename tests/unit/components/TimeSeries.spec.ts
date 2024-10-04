import { afterAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResultResponseData";
import { emptyScenario, mockPinia, mockedMetadata } from "@/tests/unit/mocks/mockPinia";
import TimeSeries from "@/components/TimeSeries.vue";
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
  openedAccordions: mockedMetadata.results.time_series.map(({ id }) => id),
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
  it("should render the correct label for the time series, and render the chart container", async () => {
    const component = await mountSuspended(TimeSeries, { props, global: { stubs, plugins } });

    expect(component.text()).toContain("Community infections");

    const chartContainer = component.find(`#${seriesId}-container`);
    expect(chartContainer.exists()).toBe(true);

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

    // All other accordions are closed, outside this component, changing the 'openedAccordions' prop
    await component.setProps({ openedAccordions: [seriesId] });

    await component.vm.$nextTick();
    expect(mockSetSize).toHaveBeenCalled();
    const secondHeight = mockSetSize.mock.calls[0][1]; // The second argument to setSize is the new height

    await component.setProps({ openedAccordions: props.openedAccordions });

    await component.vm.$nextTick();
    expect(mockSetSize).toHaveBeenCalled();
    const thirdHeight = mockSetSize.mock.calls[1][1];

    expect(secondHeight).toBeGreaterThan(thirdHeight);
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
