import type { AsyncDataRequestStatus } from "#app";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import LifeYearsCostsChart from "~/components/Charts/LifeYearsCostsChart.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import Highcharts from "highcharts/esm/highcharts";
import { mockResultResponseData } from "../../mocks/mockResponseData";
import { setActivePinia } from "pinia";

const stubs = {
  CIcon: true,
};

const scenarioWithCostData = {
  ...emptyScenario,
  parameters: {
    country: "USA",
  },
  result: {
    data: mockResultResponseData as ScenarioResultData,
    fetchError: undefined,
    fetchStatus: "success" as AsyncDataRequestStatus,
  },
};

const mockSetSize = vi.fn();
const mockDestroy = vi.fn();
const mockChart = {
  destroy: mockDestroy,
  setSize: mockSetSize,
};
vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      chart: () => mockChart,
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

// Expected life years values from mock result data (mocks/responses/results.json)
const expectedLifeYearsSeries = [
  expect.objectContaining({
    type: "column",
    data: expect.arrayContaining([
      expect.objectContaining({
        name: "Preschool-age children",
        y: 9944537.6006,
        custom: expect.objectContaining({ dollarAmountInMillions: 333.825 }),
      }),
      expect.objectContaining({
        name: "School-age children",
        y: 85875479.7768,
        custom: expect.objectContaining({ dollarAmountInMillions: 648858.7066 }),
      }),
      expect.objectContaining({
        name: "Working-age adults",
        y: 38423793.3826,
        custom: expect.objectContaining({ dollarAmountInMillions: 30637.374 }),
      }),
      expect.objectContaining({
        name: "Retirement-age adults",
        y: 23851313.06,
        custom: expect.objectContaining({ dollarAmountInMillions: 175405.3478 }),
      }),
    ]),
  }),
];

describe("life years costs chart", () => {
  it("should render the chart container", async () => {
    const component = await mountSuspended(LifeYearsCostsChart, {
      global: { stubs, plugins: [mockPinia()] },
    });

    const container = component.find("#lifeYearsChartContainer");
    expect(container.exists()).toBe(true);
  });

  it("should initialise the chart with the correct options and data", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(LifeYearsCostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: scenarioWithCostData,
        }, true, { stubActions: false })],
      },
    });

    await waitFor(() => {
      expect(chartSpy).toHaveBeenCalledWith(
        "lifeYearsChartContainer",
        expect.objectContaining({
          chart: expect.objectContaining({
            height: 300,
            style: { fontFamily: "ImperialSansText, sans-serif" },
          }),
          exporting: expect.objectContaining({
            filename: "Life years lost in USA",
            chartOptions: expect.objectContaining({
              title: expect.objectContaining({
                text: "Life years lost in USA",
              }),
            }),
          }),
          xAxis: expect.objectContaining({
            categories: ["Preschool-age children", "School-age children", "Working-age adults", "Retirement-age adults"],
          }),
          yAxis: expect.objectContaining({
            title: expect.objectContaining({
              text: "Life years lost",
            }),
          }),
          series: expectedLifeYearsSeries,
        }),
      );
    });
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(LifeYearsCostsChart, {
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithCostData }, true, { stubActions: false })] },
    });

    component.unmount();
    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    vi.useFakeTimers();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(LifeYearsCostsChart, {
      global: { stubs, plugins: [mockPinia()] },
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    window.dispatchEvent(new Event("resize"));

    vi.advanceTimersByTime(25);

    expect(mockSetSize).toHaveBeenCalledWith(0, 300, expect.objectContaining({ duration: 250 }));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    vi.useRealTimers();
  });

  it("should expose series data via data-summary attribute for testing", async () => {
    const pinia = mockPinia({ currentScenario: scenarioWithCostData }, true, { stubActions: false });
    setActivePinia(pinia);

    const component = await mountSuspended(LifeYearsCostsChart, {
      global: { stubs, plugins: [pinia] },
    });

    await waitFor(() => {
      const dataSummary = component.find("#lifeYearsChartContainer").attributes("data-summary");
      expect(dataSummary).not.toBeUndefined();
      const parsed = JSON.parse(dataSummary!);
      expect(parsed.data).toHaveLength(4);
      expect(parsed.data[0].y).toBe(9944537.6006);
    });
  });
});
