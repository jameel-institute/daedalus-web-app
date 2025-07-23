import type { AsyncDataRequestStatus } from "#app";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CompareCostsChart from "~/components/CompareCostsChart.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import Highcharts from "highcharts/esm/highcharts";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { setActivePinia } from "pinia";

const stubs = {
  CIcon: true,
};

const highVaccineScenario = {
  ...emptyScenario,
  parameters: {
    vaccine: "high",
  },
  result: {
    data: mockResultResponseData as ScenarioResultData,
    fetchError: undefined,
    fetchStatus: "success" as AsyncDataRequestStatus,
  },
};

const lowVaccineScenario = {
  ...highVaccineScenario,
  parameters: {
    ...highVaccineScenario.parameters,
    vaccine: "low",
  },
  result: {
    ...highVaccineScenario.result,
    data: {
      ...mockResultResponseData,
      costs: [
        {
          id: "total",
          value: 60000,
          children: [
            {
              id: "gdp",
              value: 10000,
            },
            {
              id: "education",
              value: 20000,
            },
            {
              id: "life_years",
              value: 30000,
            },
          ],
        },
      ],
    },
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
      HTMLElement: {
        useForeignObject: undefined,
      },
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

const expectedPercentGDPSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [
      expect.objectContaining({
        name: "GDP",
        y: 32.87931628748886,
      }),
      expect.objectContaining({
        name: "GDP",
        y: 0.050344764471232505,
      }),
    ],
  }),
  expect.objectContaining({
    name: "Education",
    data: [
      expect.objectContaining({
        name: "Education",
        y: 7.74667209175136,
      }),
      expect.objectContaining({
        name: "Education",
        y: 0.10068952894246501,
      }),
    ],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [
      expect.objectContaining({
        name: "Life years",
        y: 4.305661740495233,
      }),
      expect.objectContaining({
        name: "Life years",
        y: expect.closeTo(0.151, 0.001),
      }),
    ],
  }),
];

const expectedUSDSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [
      expect.objectContaining({
        name: "GDP",
        y: 6530831.2856,
        custom: {
          costAsGdpPercent: 32.87931628748886,
        },
      }),
      expect.objectContaining({
        name: "GDP",
        y: 10000,
        custom: {
          costAsGdpPercent: 0.050344764471232505,
        },
      }),
    ],
  }),
  expect.objectContaining({
    name: "Education",
    data: [
      expect.objectContaining({
        name: "Education",
        y: 1538724.4678,
        custom: {
          costAsGdpPercent: 7.74667209175136,
        },
      }),
      expect.objectContaining({
        name: "Education",
        y: 20000,
        custom: {
          costAsGdpPercent: 0.10068952894246501,
        },
      }),
    ],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [
      expect.objectContaining({
        name: "Life years",
        y: 855235.2535,
        custom: {
          costAsGdpPercent: 4.305661740495233,
        },
      }),
      expect.objectContaining({
        name: "Life years",
        y: 30000,
        custom: {
          costAsGdpPercent: expect.closeTo(0.151, 0.001),
        },
      }),
    ],
  }),
];

describe("costs chart", () => {
  it("should render the costs chart container", async () => {
    const component = await mountSuspended(CompareCostsChart, {
      global: { stubs, plugins: [mockPinia()] },
    });

    const container = component.find(`#compareCostsChartContainer`);
    expect(container.exists()).toBe(true);
  });

  it("should initialise the chart with the correct options and data for cost basis of GDP percent", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CompareCostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentComparison: {
            axis: "vaccine",
            baseline: "high",
            scenarios: [highVaccineScenario, lowVaccineScenario],
          },
          preferences: {
            costBasis: CostBasis.PercentGDP,
          },
          metadata: mockMetadataResponseData,
        }, false, { stubActions: false })],
      },
    });

    await waitFor(() => {
      expect(chartSpy).toHaveBeenCalledWith(
        "compareCostsChartContainer",
        expect.objectContaining({
          chart: expect.objectContaining({
            height: 400,
            style: { fontFamily: "ImperialSansText, sans-serif" },
          }),
          exporting: expect.objectContaining({
            filename: "Losses by global vaccine investment",
            chartOptions: expect.objectContaining({
              title: expect.objectContaining({
                text: "Losses by global vaccine investment",
              }),
            }),
          }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["high", "low"]),
            title: expect.objectContaining({
              text: "Global vaccine investment",
            }),
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

    await mountSuspended(CompareCostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentComparison: {
            axis: "vaccine",
            baseline: "high",
            scenarios: [highVaccineScenario, lowVaccineScenario],
          },
          preferences: {
            costBasis: CostBasis.USD,
          },
          metadata: mockMetadataResponseData,
        }, false, { stubActions: false })],
      },
    });

    await waitFor(() => {
      expect(chartSpy).toHaveBeenCalledWith(
        "compareCostsChartContainer",
        expect.objectContaining({
          chart: expect.objectContaining({
            height: 400,
            style: { fontFamily: "ImperialSansText, sans-serif" },
          }),
          exporting: expect.objectContaining({
            filename: "Losses by global vaccine investment",
            chartOptions: expect.objectContaining({
              title: expect.objectContaining({
                text: "Losses by global vaccine investment",
              }),
            }),
          }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["high", "low"]),
            title: expect.objectContaining({
              text: "Global vaccine investment",
            }),
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
    const pinia = mockPinia({
      currentComparison: {
        axis: "vaccine",
        baseline: "high",
        scenarios: [highVaccineScenario, lowVaccineScenario],
      },
      preferences: {
        costBasis: CostBasis.USD,
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });

    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia] } });

    appStore.preferences.costBasis = CostBasis.PercentGDP;

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
    const pinia = mockPinia({
      currentComparison: {
        axis: "vaccine",
        baseline: "high",
        scenarios: [highVaccineScenario, lowVaccineScenario],
      },
      preferences: {
        costBasis: CostBasis.PercentGDP,
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });

    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia] } });

    appStore.preferences.costBasis = CostBasis.USD;

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
    const component = await mountSuspended(CompareCostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentComparison: {
            axis: "vaccine",
            baseline: "high",
            scenarios: [highVaccineScenario, lowVaccineScenario],
          },
          preferences: {
            costBasis: CostBasis.USD,
          },
          metadata: mockMetadataResponseData,
        }, false, { stubActions: false })],
      },
    });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(CompareCostsChart, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentComparison: {
            axis: "vaccine",
            baseline: "high",
            scenarios: [highVaccineScenario, lowVaccineScenario],
          },
          preferences: {
            costBasis: CostBasis.USD,
          },
          metadata: mockMetadataResponseData,
        }, false, { stubActions: false })],
      },
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
