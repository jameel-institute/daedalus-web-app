import type { AsyncDataRequestStatus } from "#app";
import type { ScenarioResultData } from "@/types/apiResponseTypes";
import CostsChart from "~/components/CostsChart.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import Highcharts from "highcharts/esm/highcharts";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";

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
const mockUpdate = vi.fn();
const mockChart = {
  destroy: mockDestroy,
  setSize: mockSetSize,
  update: mockUpdate,
};
vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      chart: () => mockChart,
      getOptions: actual.default.getOptions,
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

const expectedPercentGDPSeries = [
  expect.objectContaining({
    data: [
      expect.objectContaining({
        name: "Closures",
        y: 31.863518237335548,
      }),
      expect.objectContaining({
        name: "Closures",
        y: 7.730833087642491,
      }),
      expect.objectContaining({
        name: "Preschool-age children",
        y: 0.0016806340999609194,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({
        name: "Absences",
        y: 1.0157980496498658,
      }),
      expect.objectContaining({
        name: "Absences",
        y: 0.015839004612315456,
      }),
      expect.objectContaining({
        name: "School-age children",
        y: 3.2666638758885562,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({
        name: "Working-age adults",
        y: 0.15424313780470625,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({
        name: "Retirement-age adults",
        y: 0.8830740921985621,
      }),
    ],
  }),
];

const expectedUSDSeries = [
  expect.objectContaining({
    data: [
      expect.objectContaining({
        name: "Closures",
        y: 6329062.9268,
      }),
      expect.objectContaining({
        name: "Closures",
        y: 1535578.3603,
      }),
      expect.objectContaining({
        name: "Preschool-age children",
        y: 333.825,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({
        name: "Absences",
        y: 201768.3587,
      }),
      expect.objectContaining({
        name: "Absences",
        y: 3146.1076,
      }),
      expect.objectContaining({
        name: "School-age children",
        y: 648858.7066,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({
        name: "Working-age adults",
        y: 30637.374,
      }),
    ],
  }),
  expect.objectContaining({
    data: [
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({ y: 0, name: "" }),
      expect.objectContaining({
        name: "Retirement-age adults",
        y: 175405.3478,
      }),
    ],
  }),
];

describe("costs pie", () => {
  it("should render the costs chart container", async () => {
    const component = await mountSuspended(CostsChart, {
      global: { stubs, plugins: [mockPinia()] },
      props: { basis: CostBasis.PercentGDP },
    });

    const container = component.find(`#costsChartContainer`);
    expect(container.exists()).toBe(true);
  });

  it("should initialise the chart with the correct options and data for cost basis of GDP percent", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: scenarioWithCostData,
        }, true, { stubActions: false })],
      },
      props: { basis: CostBasis.PercentGDP },
    });

    await waitFor(() => {
      expect(chartSpy).toHaveBeenCalledWith(
        "costsChartContainer",
        expect.objectContaining({
          chart: expect.objectContaining({
            height: 400,
            style: { fontFamily: "ImperialSansText, sans-serif" },
          }),
          exporting: expect.objectContaining({
            filename: "Losses in USA",
            chartOptions: expect.objectContaining({
              title: expect.objectContaining({
                text: "Losses in USA",
              }),
            }),
          }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["GDP", "Education", "Life years"]),
          }),
          yAxis: expect.objectContaining({
            title: expect.objectContaining({
              text: "Losses as % of 2018 national GDP",
            }),
          }),
          series: expectedPercentGDPSeries,
        }),
      );
    });
  });

  it("should initialise the chart with the correct options and data for cost basis of USD", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: scenarioWithCostData,
        }, true, { stubActions: false })],
      },
      props: { basis: CostBasis.USD },
    });

    await waitFor(() => {
      expect(chartSpy).toHaveBeenCalledWith(
        "costsChartContainer",
        expect.objectContaining({
          chart: expect.objectContaining({
            height: 400,
            style: { fontFamily: "ImperialSansText, sans-serif" },
          }),
          exporting: expect.objectContaining({
            filename: "Losses in USA",
            chartOptions: expect.objectContaining({
              title: expect.objectContaining({
                text: "Losses in USA",
              }),
            }),
          }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["GDP", "Education", "Life years"]),
          }),
          yAxis: expect.objectContaining({
            title: expect.objectContaining({
              text: "Losses in billions USD",
            }),
          }),
          series: expectedUSDSeries,
        }),
      );
    });
  });

  it("should update the chart with the correct options and data when changing cost basis from USD to GDP percent", async () => {
    const component = await mountSuspended(CostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: scenarioWithCostData,
        }, true, { stubActions: false })],
      },
      props: { basis: CostBasis.USD },
    });

    await component.setProps({ basis: CostBasis.PercentGDP });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          yAxis: expect.objectContaining({
            title: expect.objectContaining({
              text: "Losses as % of 2018 national GDP",
            }),
          }),
          series: expectedPercentGDPSeries,
        }),
      );
    });
  });

  it("should update the chart with the correct options and data when changing cost basis from GDP percent to USD", async () => {
    const component = await mountSuspended(CostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: scenarioWithCostData,
        }, true, { stubActions: false })],
      },
      props: { basis: CostBasis.PercentGDP },
    });

    await component.setProps({ basis: CostBasis.USD });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          yAxis: expect.objectContaining({
            title: expect.objectContaining({
              text: "Losses in billions USD",
            }),
          }),
          series: expectedUSDSeries,
        }),
      );
    });
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(CostsChart, {
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithCostData })] },
      props: { basis: CostBasis.USD },
    });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(CostsChart, {
      global: { stubs, plugins: [mockPinia()] },
      props: { basis: CostBasis.PercentGDP },
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    window.dispatchEvent(new Event("resize"));

    await nextTick();

    expect(mockSetSize).toHaveBeenCalledWith(0, 400, expect.objectContaining({ duration: 250 }));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
