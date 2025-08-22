import { mountSuspended } from "@nuxt/test-utils/runtime";
import TimeSeriesGroup from "~/components/TimeSeriesGroup.client.vue";
import type { DisplayInfo, ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockedMetadata, mockPinia } from "../mocks/mockPinia";
import { mockResultResponseData } from "../mocks/mockResponseData";

const mockUpdate = vi.fn();

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
        showResetZoom: vi.fn(),
        update: vi.fn(arg => mockUpdate(arg)),
        xAxis: [{
          removePlotBand: vi.fn,
          addPlotBand: vi.fn,
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

const pinia = mockPinia({
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
});
const getProps = (open = true) => ({
  seriesGroup: mockedMetadata.results.time_series_groups[0],
  groupIndex: 0,
  hideTooltips: false,
  open,
  chartHeight: 100,
  synchPoint: { x: 1, y: 2 },
});

describe("timeSeriesGroup component", () => {
  it("should render default total chart & toggle when when open prop is true", async () => {
    const timeSeries = mockedMetadata.results.time_series[0] as DisplayInfo;
    const component = await mountSuspended(TimeSeriesGroup, {
      global: {
        plugins: [pinia],
      },
      props: getProps(),
    });

    const text = component.text();

    expect(text).toContain("New per day");
    expect(component.find("#infectionsDailySwitch").exists()).toBe(true);
    expect(text).toContain(timeSeries.label);
    expect(text).toContain(timeSeries.description);
    expect(component.find("#prevalence-container").isVisible()).toBe(true);
  });

  it("should not render toggle and chart when open is false", async () => {
    const component = await mountSuspended(TimeSeriesGroup, {
      global: {
        plugins: [pinia],
      },
      props: getProps(false),
    });

    const text = component.text();

    expect(text).not.toContain("New per day");
    expect(component.find("#infectionsDailySwitch").exists()).toBe(false);
  });

  it("should be able to toggle on new per day chart and visa versa", async () => {
    const component = await mountSuspended(TimeSeriesGroup, {
      global: {
        plugins: [pinia],
      },
      props: getProps(true),
    });

    const toggleSwitch = component.find("#infectionsDailySwitch");
    await toggleSwitch.setValue(true);

    expect(component.text()).toContain("New infections");
    expect(component.text()).not.toContain("Prevalence");

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      series: expect.arrayContaining([
        expect.objectContaining({
          type: "line",
          name: "New infections",
        }),
      ]),
    }));

    await toggleSwitch.setValue(false);

    expect(component.text()).toContain("Prevalence");
    expect(component.text()).not.toContain("New infections");

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      series: expect.arrayContaining([
        expect.objectContaining({
          type: "area",
          name: "Prevalence",
        }),
      ]),
    }));
  });

  it("should emit toggleOpen when the accordion header is clicked", async () => {
    const component = await mountSuspended(TimeSeriesGroup, {
      global: { plugins: [pinia] },
      props: getProps(),
    });

    const accordionHeader = component.findComponent({
      name: "CAccordionHeader",
    });
    await accordionHeader.trigger("click");

    expect(component.emitted("toggleOpen")).toBeTruthy();
  });
});
