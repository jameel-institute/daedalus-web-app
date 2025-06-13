import type { ScenarioResultData } from "@/types/apiResponseTypes";
import {
  emptyScenario,
  mockedMetadata,
  mockPinia,
} from "@/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import * as Highcharts from "highcharts";
import TimeSeries from "~/components/TimeSeries.client.vue";

const timeSeriesId = mockedMetadata.results.time_series[1].id; // hospitalized
const stubs = {
  CIcon: true,
};
const plugins = [
  mockPinia({
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
  }),
];
const props = {
  seriesId: timeSeriesId,
  hideTooltips: false,
  groupIndex: 1,
  seriesIndex: 0,
  yUnits: "in need of hospitalisation",
  chartHeight: 100,
  seriesRole: "total",
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
    wrap: actual.wrap,
    Pointer: actual.Pointer,
  };
});

describe("time series", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it("should initialise the chart with the correct options", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(TimeSeries, {
      props,
      global: { stubs, plugins },
    });

    expect(chartSpy).toHaveBeenCalledWith(
      "hospitalised-container",
      expect.objectContaining({
        chart: expect.objectContaining({
          height: props.chartHeight,
          backgroundColor: "transparent",
        }),
        exporting: expect.objectContaining({
          filename: "Hospital demand in USA",
          chartOptions: expect.objectContaining({
            title: {
              text: "Hospital demand",
            },
            subtitle: {
              text: "Infections requiring hospitalisation",
            },
          }),
        }),
        tooltip: expect.objectContaining({
          // This test permits both "(in need of) hospitaliz/sation" and "hospitaliz/sed"
          pointFormat: expect.stringContaining("hospital"),
        }),
        xAxis: expect.objectContaining({
          plotBands: expect.arrayContaining([
            expect.objectContaining({
              from: 30,
              to: 600,
            }),
          ]),
        }),
        yAxis: expect.objectContaining({
          minRange: 434700,
          plotLines: expect.arrayContaining([
            expect.objectContaining({
              value: 434700,
            }),
          ]),
        }),
        series: expect.arrayContaining([
          expect.objectContaining({
            data: expect.arrayContaining([
              [1, 0],
              [2, 4.2465],
            ]),
          }),
        ]),
      }),
    );
  });

  it("should emit chart created event when the chart is initialised", async () => {
    const component = await mountSuspended(TimeSeries, {
      props,
      global: { stubs, plugins },
    });

    expect(component.emitted("chartCreated")).toBeTruthy();
    expect(component.emitted("chartCreated")![0][0]).toBe("hospitalised");
  });

  it("should resize the chart when height changes", async () => {
    const component = await mountSuspended(TimeSeries, {
      props,
      global: { stubs, plugins },
    });

    await component.setProps({ chartHeight: 200 });
    // Allow enough time for debounce to finish
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockSetSize).toHaveBeenCalledWith(undefined, 200, { duration: 250 });
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(TimeSeries, {
      props,
      global: { stubs, plugins },
    });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });
});
