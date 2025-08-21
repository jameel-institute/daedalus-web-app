import type { ScenarioResultData } from "~/types/apiResponseTypes";
import {
  emptyScenario,
  mockedMetadata,
  mockPinia,
} from "@/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Highcharts from "highcharts/esm/highcharts";
import TimeSeries from "~/components/TimeSeries.client.vue";

const timeSeriesMetadata = mockedMetadata.results.time_series.find(({ id }) => id === "hospitalised");
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
  }, true, { stubActions: false }),
];
const props = {
  chartHeight: 100,
  groupIndex: 1,
  hideTooltips: false,
  seriesRole: "total",
  synchPoint: { x: 1, y: 2 },
  timeSeriesMetadata,
};

const mockSetSize = vi.fn();
const mockDestroy = vi.fn();
const mockUpdate = vi.fn();
const mockYAxisUpdate = vi.fn();
const mockRemovePlotBand = vi.fn();
const mockAddPlotBand = vi.fn();
const mockRemovePlotLine = vi.fn();
const mockAddPlotLine = vi.fn();

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: mockDestroy,
        setSize: mockSetSize,
        showResetZoom: vi.fn(),
        update: vi.fn(arg => mockUpdate(arg)),
        xAxis: [{
          removePlotBand: vi.fn(arg => mockRemovePlotBand(arg)),
          addPlotBand: vi.fn(arg => mockAddPlotBand(arg)),
        }],
        yAxis: [{
          removePlotLine: vi.fn(arg => mockRemovePlotLine(arg)),
          addPlotLine: vi.fn(arg => mockAddPlotLine(arg)),
          update: vi.fn(arg => mockYAxisUpdate(arg)),
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
          filename: "Hospital demand",
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
            type: "area",
            data: expect.arrayContaining([
              [1, 0],
              [2, 4.2465],
            ]),
          }),
        ]),
      }),
    );
  });

  it("should update the chart when props change", async () => {
    const component = await mountSuspended(TimeSeries, {
      props,
      global: { stubs, plugins },
    });

    const newTimeSeriesMetadata = mockedMetadata.results.time_series.find(({ id }) => id === "new_hospitalised");

    await component.setProps({ seriesRole: "daily", timeSeriesMetadata: newTimeSeriesMetadata });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      series: expect.arrayContaining([
        expect.objectContaining({
          type: "line",
          name: "New hospitalisations",
        }),
      ]),
      exporting: expect.objectContaining({
        filename: "New hospitalisations",
        chartOptions: expect.objectContaining({
          title: {
            text: "New hospitalisations",
          },
          subtitle: {
            text: "Number of new patients in need of hospitalisation per day",
          },
        }),
      }),
    }));
    expect(mockRemovePlotLine).toHaveBeenCalledWith("hospital_capacity-434700");
    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();

    await component.setProps({ seriesRole: "total", timeSeriesMetadata });
    expect(mockYAxisUpdate).toHaveBeenCalledWith(expect.objectContaining({
      minRange: 434700,
    }));
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      series: expect.arrayContaining([
        expect.objectContaining({
          type: "area",
          name: "Hospital demand",
        }),
      ]),
      exporting: expect.objectContaining({
        filename: "Hospital demand",
        chartOptions: expect.objectContaining({
          title: {
            text: "Hospital demand",
          },
          subtitle: {
            text: "Infections requiring hospitalisation",
          },
        }),
      }),
    }));
    expect(mockAddPlotLine).toHaveBeenCalledWith(expect.objectContaining({
      value: 434700,
      label: expect.objectContaining({
        text: "Hospital surge capacity: 434,700",
      }),
    }));
    expect(mockRemovePlotBand).not.toHaveBeenCalled();
    expect(mockAddPlotBand).not.toHaveBeenCalled();
  });

  it("can handle more than one intervention per series", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");
    await mountSuspended(TimeSeries, {
      props,
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: {
            ...emptyScenario,
            parameters: {
              country: "USA",
            },
            result: {
              data: {
                ...mockResultResponseData as ScenarioResultData,
                interventions: [
                  {
                    id: "response",
                    start: 30.9,
                    end: 200.1,
                  },
                  {
                    id: "response",
                    start: 250,
                    end: 600,
                  },
                ],
              },
              fetchError: undefined,
              fetchStatus: "success",
            },
          },
        }, true, { stubActions: false })],
      },
    });

    expect(chartSpy).toHaveBeenCalledWith(
      "hospitalised-container",
      expect.objectContaining({
        xAxis: expect.objectContaining({
          plotBands: expect.arrayContaining([
            expect.objectContaining({
              from: 31,
              to: 200,
            }),
            expect.objectContaining({
              from: 250,
              to: 600,
            }),
          ]),
        }),
      }),
    );
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
