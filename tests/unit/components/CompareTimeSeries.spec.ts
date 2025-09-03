import {
  emptyScenario,
  mockedMetadata,
  mockPinia,
} from "@/tests/unit/mocks/mockPinia";
import { mockMetadataResponseData, mockResultResponseData } from "@/tests/unit/mocks/mockResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Highcharts from "highcharts/esm/highcharts";
import { CompareTimeSeries } from "#components";
import type { DisplayInfo, ScenarioResultData } from "~/types/apiResponseTypes";
import { colorBlindSafeLargePalette } from "~/components/utils/charts";

const baselineLineWidth = 3;
const normalLineWidth = 1.5;

const timeSeriesMetadata = mockedMetadata.results.time_series.find(({ id }) => id === "hospitalised");
const dataWithHigherNumbers = {
  ...mockResultResponseData,
  time_series: Object.entries(mockResultResponseData.time_series).reduce(
    (acc, [k, data]) => ({ ...acc, [k]: data.map(d => d + 1000) }),
    {},
  ),
} as ScenarioResultData;

const plugins = [
  mockPinia({
    currentComparison: {
      axis: "country",
      baseline: "USA",
      scenarios: [{
        ...emptyScenario,
        parameters: { country: "USA" },
        runId: "usaRunId",
        result: {
          data: mockResultResponseData as ScenarioResultData,
          fetchError: undefined,
          fetchStatus: "success",
        },
      }, {
        ...emptyScenario,
        parameters: { country: "GBR" },
        runId: "ukRunId",
        result: {
          data: dataWithHigherNumbers,
          fetchError: undefined,
          fetchStatus: "success",
        },
      }],
    },
    metadata: mockMetadataResponseData,
  }, false, { stubActions: false }),
];
const props = {
  groupIndex: 1,
  hideTooltips: false,
  showCapacities: true,
  synchPoint: { x: 1, y: 2 } as Highcharts.Point,
  timeSeriesMetadata: timeSeriesMetadata as DisplayInfo,
};

const mockDestroy = vi.fn();
const mockUpdate = vi.fn();
const mockRedraw = vi.fn();
const mockYAxisUpdate = vi.fn();
const mockRemovePlotLine = vi.fn();
const mockAddPlotLine = vi.fn();
const mockUkSeriesUpdate = vi.fn();
const mockUsaSeriesUpdate = vi.fn();

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal() as { default: typeof Highcharts };

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: mockDestroy,
        redraw: mockRedraw,
        showResetZoom: vi.fn(),
        update: vi.fn((...args) => mockUpdate(...args)),
        yAxis: [{
          removePlotLine: vi.fn(arg => mockRemovePlotLine(arg)),
          addPlotLine: vi.fn(arg => mockAddPlotLine(arg)),
          update: vi.fn(arg => mockYAxisUpdate(arg)),
        }],
        series: [{
          update: vi.fn((...args) => mockUsaSeriesUpdate(...args)),
          options: { custom: { scenarioId: "usaRunId" } },
        }, {
          update: vi.fn((...args) => mockUkSeriesUpdate(...args)),
          options: { custom: { scenarioId: "ukRunId" } },
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
  it("should initialise the chart with the correct options for hospitalisations time series group", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");
    await mountSuspended(CompareTimeSeries, { props, global: { plugins } });

    expect(chartSpy).toHaveBeenCalledWith(
      "time-series-comparison-1",
      expect.objectContaining({
        chart: expect.objectContaining({ backgroundColor: "transparent" }),
        exporting: expect.objectContaining({
          filename: "Hospital demand by country",
          chartOptions: expect.objectContaining({
            title: { text: "Hospital demand by country" },
            subtitle: { text: "Infections requiring hospitalisation" },
          }),
        }),
        series: expect.arrayContaining([
          expect.objectContaining({
            type: "line",
            name: "Country: United States",
            color: colorBlindSafeLargePalette.find(c => c.name === "Purple")!.rgb,
            lineWidth: baselineLineWidth,
            data: expect.arrayContaining([[1, 0], [3, 7.5818]]),
            custom: expect.objectContaining({ showInterventions: true, showCapacities: true, isBaseline: true }),
          }),
          expect.objectContaining({
            type: "line",
            name: "Country: United Kingdom",
            color: colorBlindSafeLargePalette.find(c => c.name === "Yellow")!.rgb,
            lineWidth: normalLineWidth,
            data: expect.arrayContaining([[1, 1000], [3, 1007.5818]]),
            custom: expect.objectContaining({ showInterventions: true, showCapacities: true, isBaseline: false }),
          }),
        ]),
        xAxis: expect.objectContaining({
          plotBands: expect.arrayContaining([expect.objectContaining({ from: 30, to: 600 })]),
        }),
        yAxis: expect.objectContaining({
          minRange: 434700,
          plotLines: expect.arrayContaining([expect.objectContaining({ value: 434700 })]),
        }),
      }),
    );
  });

  it("should initialise the chart with the correct options for vaccinations time series group", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CompareTimeSeries, {
      props: {
        groupIndex: 3,
        hideTooltips: true,
        showCapacities: false,
        synchPoint: undefined,
        timeSeriesMetadata: mockedMetadata.results.time_series.find(({ id }) => id === "vaccinated") as DisplayInfo,
      },
      global: { plugins },
    });

    expect(chartSpy).toHaveBeenCalledWith(
      "time-series-comparison-3",
      expect.objectContaining({
        exporting: expect.objectContaining({
          filename: "Vaccinated by country",
          chartOptions: expect.objectContaining({
            title: { text: "Vaccinated by country" },
            subtitle: { text: "Total number of vaccinations administered" },
          }),
        }),
        series: expect.arrayContaining([
          expect.objectContaining({
            custom: expect.objectContaining({ showInterventions: false, showCapacities: false }),
          }),
        ]),
        xAxis: expect.objectContaining({ plotBands: [] }),
        yAxis: expect.objectContaining({ minRange: undefined, plotLines: [] }),
      }),
    );
  });

  it("should update the chart when props change", async () => {
    const component = await mountSuspended(CompareTimeSeries, { props, global: { plugins } });

    await component.setProps({ showCapacities: false });
    // Plot line exists only for the baseline (forgrounded) scenario:
    expect(mockRemovePlotLine).toHaveBeenCalledWith("hospital_capacity-434700-usaRunId");

    await component.setProps({ showCapacities: true });
    expect(mockAddPlotLine).toHaveBeenCalledWith(expect.objectContaining({ id: "hospital_capacity-434700-usaRunId" }));

    const newTimeSeriesMetadata = mockedMetadata.results.time_series.find(({ id }) => id === "new_hospitalised");
    await component.setProps({ timeSeriesMetadata: newTimeSeriesMetadata });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      exporting: expect.objectContaining({
        filename: "New hospitalisations by country",
        chartOptions: expect.objectContaining({
          title: { text: "New hospitalisations by country" },
          subtitle: { text: "Number of new patients in need of hospitalisation per day" },
        }),
      }),
    }));
    expect(mockUsaSeriesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([[1, 0], [3, 3.8318]]),
    }), false);
    expect(mockUkSeriesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([[1, 1000], [3, 1003.8318]]),
    }), false);
    expect(mockRedraw).toHaveBeenCalled();
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(CompareTimeSeries, { props, global: { plugins } });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });
});
