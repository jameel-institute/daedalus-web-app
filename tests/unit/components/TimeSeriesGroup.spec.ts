import { mountSuspended } from "@nuxt/test-utils/runtime";
import TimeSeriesGroup from "~/components/TimeSeriesGroup.client.vue";
import type { DisplayInfo, ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockedMetadata, mockPinia } from "../mocks/mockPinia";
import { mockResultResponseData } from "../mocks/mockResponseData";

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
  open,
  groupIndex: 0,
  hideTooltips: false,
  chartHeightPx: 100,
  minChartHeightPx: 50,
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
    const timeSeriesGroups = mockedMetadata.results
      .time_series_groups[0] as TimeSeriesGroup;
    const component = await mountSuspended(TimeSeriesGroup, {
      global: {
        plugins: [pinia],
      },
      props: getProps(true),
    });

    const toggleSwitch = component.find("#infectionsDailySwitch");
    await toggleSwitch.setValue("true");

    expect(component.text()).toContain("New infections");

    await toggleSwitch.trigger("click");

    expect(component.text()).not.toContain("Prevalence");

    const emitChartCreated = component.emitted("chartCreated")!;
    expect(emitChartCreated[0][0]).toBe(timeSeriesGroups.time_series.total);
    expect(emitChartCreated[1][0]).toBe(timeSeriesGroups.time_series.daily);
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
