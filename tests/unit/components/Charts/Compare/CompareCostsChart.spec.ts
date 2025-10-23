import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CompareCostsChart from "~/components/Charts/Compare/CompareCostsChart.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import Highcharts from "highcharts/esm/highcharts";
import { mockMetadataResponseData, mockResultResponseData } from "../../../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { setActivePinia } from "pinia";

const stubs = {
  CIcon: true,
};

const highVaccineScenario = structuredClone(emptyScenario);
highVaccineScenario.runId = "scenarioId1";
highVaccineScenario.parameters = { vaccine: "high" };
highVaccineScenario.result.data = mockResultResponseData as ScenarioResultData;
const lowVaccineScenario = structuredClone(highVaccineScenario);
lowVaccineScenario.runId = "scenarioId2";
lowVaccineScenario.parameters.vaccine = "low";
lowVaccineScenario.result.data.costs = [
  {
    id: "total",
    value: 60000,
    children: [
      { id: "gdp", values: [{ metric: "usd_millions", value: 10000 }] },
      { id: "education", values: [{ metric: "usd_millions", value: 20000 }] },
      { id: "life_years", values: [{ metric: "usd_millions", value: 30000 }] },
    ],
  },
];

const pinia = (costBasis: CostBasis) => mockPinia({
  currentComparison: { axis: "vaccine", baseline: "high", scenarios: [highVaccineScenario, lowVaccineScenario] },
  preferences: { costBasis },
  metadata: mockMetadataResponseData,
}, false, { stubActions: false });

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
      HTMLElement: { useForeignObject: undefined },
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

const expectedUndiffedPercentGDPSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [
      expect.objectContaining({
        name: "GDP",
        y: 32.87931628748886,
        custom: expect.objectContaining({
          stackNetTotal: 44.93165011973545,
        }),
      }),
      expect.objectContaining({
        name: "GDP",
        y: 0.050344764471232505,
        custom: expect.objectContaining({
          stackNetTotal: 0.302068586827395,
        }),
      }),
    ],
  }),
  expect.objectContaining({
    name: "Education",
    data: [
      expect.objectContaining({
        name: "Education",
        y: 7.74667209175136,
        custom: expect.objectContaining({
          stackNetTotal: 44.93165011973545,
        }),
      }),
      expect.objectContaining({
        name: "Education",
        y: 0.10068952894246501,
        custom: expect.objectContaining({
          stackNetTotal: 0.302068586827395,
        }),
      }),
    ],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [
      expect.objectContaining({
        name: "Life years",
        y: 4.305661740495233,
        custom: expect.objectContaining({
          stackNetTotal: 44.93165011973545,
        }),
      }),
      expect.objectContaining({
        name: "Life years",
        y: expect.closeTo(0.151, 0.001),
        custom: expect.objectContaining({
          stackNetTotal: 0.302068586827395,
        }),
      }),
    ],
  }),
];

const expectedUndiffedUSDSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [
      expect.objectContaining({
        name: "GDP",
        y: 6530831.2856,
        custom: expect.objectContaining({
          costAsGdpPercent: 32.87931628748886,
          stackNetTotal: 8924791.0069,
        }),
      }),
      expect.objectContaining({
        name: "GDP",
        y: 10000,
        custom: expect.objectContaining({
          costAsGdpPercent: 0.050344764471232505,
          stackNetTotal: 60000,
        }),
      }),
    ],
  }),
  expect.objectContaining({
    name: "Education",
    data: [
      expect.objectContaining({
        name: "Education",
        y: 1538724.4678,
        custom: expect.objectContaining({
          costAsGdpPercent: 7.74667209175136,
          stackNetTotal: 8924791.0069,
        }),
      }),
      expect.objectContaining({
        name: "Education",
        y: 20000,
        custom: expect.objectContaining({
          costAsGdpPercent: 0.10068952894246501,
          stackNetTotal: 60000,
        }),
      }),
    ],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [
      expect.objectContaining({
        name: "Life years",
        y: 855235.2535,
        custom: expect.objectContaining({
          costAsGdpPercent: 4.305661740495233,
          stackNetTotal: 8924791.0069,
        }),
      }),
      expect.objectContaining({
        name: "Life years",
        y: 30000,
        custom: expect.objectContaining({
          costAsGdpPercent: expect.closeTo(0.151, 0.001),
          stackNetTotal: 60000,
        }),
      }),
    ],
  }),
];

const expectedDiffedPercentGDPSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [expect.objectContaining({
      name: "GDP",
      y: -32.82897152301763,
      custom: expect.objectContaining({ stackNetTotal: -44.62958153290806 }),
    })],
  }),
  expect.objectContaining({
    name: "Education",
    data: [expect.objectContaining({
      name: "Education",
      y: -7.645982562808894,
      custom: expect.objectContaining({ stackNetTotal: -44.62958153290806 }),
    })],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [expect.objectContaining({
      name: "Life years",
      y: -4.154627447081535,
      custom: expect.objectContaining({ stackNetTotal: -44.62958153290806 }),
    })],
  }),
];

const expectedDiffedUSDSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [expect.objectContaining({
      name: "GDP",
      y: -6520831.2856,
      custom: expect.objectContaining({
        stackNetTotal: -8864791.0069,
        costAsGdpPercent: -32.82897152301763,
      }),
    })],
  }),
  expect.objectContaining({
    name: "Education",
    data: [expect.objectContaining({
      name: "Education",
      y: -1518724.4678,
      custom: expect.objectContaining({
        stackNetTotal: -8864791.0069,
        costAsGdpPercent: -7.645982562808894,
      }),
    })],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [expect.objectContaining({
      name: "Life years",
      y: -825235.2535,
      custom: expect.objectContaining({
        stackNetTotal: -8864791.0069,
        costAsGdpPercent: -4.154627447081535,
      }),
    })],
  }),
];

describe("costs chart", () => {
  it("should render the costs chart container", async () => {
    const component = await mountSuspended(CompareCostsChart, {
      global: { stubs, plugins: [pinia(CostBasis.USD)] },
      props: { diffing: false },
    });

    const container = component.find(`#compareCostsChartContainer`);
    expect(container.exists()).toBe(true);
  });

  describe("when NOT in diffing mode", () => {
    it.each([
      {
        costBasis: CostBasis.PercentGDP,
        yAxisTitle: "Losses as % of GDP",
        expectedSeries: expectedUndiffedPercentGDPSeries,
      },
      {
        costBasis: CostBasis.USD,
        yAxisTitle: "Losses in billions USD",
        expectedSeries: expectedUndiffedUSDSeries,
      },
    ])("should initialise the chart with correct options for cost basis of $costBasis", async ({ costBasis, yAxisTitle, expectedSeries }) => {
      const chartSpy = vi.spyOn(Highcharts, "chart");

      await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(costBasis)] }, props: { diffing: false } });

      await waitFor(() => {
        expect(chartSpy).toHaveBeenCalledWith(
          "compareCostsChartContainer",
          expect.objectContaining({
            chart: expect.objectContaining({ height: 500, style: { fontFamily: "ImperialSansText, sans-serif" } }),
            title: expect.objectContaining({ text: "Losses after 599 days" }),
            exporting: expect.objectContaining({
              filename: "Losses after 599 days",
            }),
            xAxis: expect.objectContaining({
              categories: expect.arrayContaining(["high", "low"]),
              title: expect.objectContaining({ text: "Global vaccine investment" }),
            }),
            yAxis: expect.objectContaining({
              min: 0,
              plotLines: [],
              title: expect.objectContaining({ text: yAxisTitle }),
            }),
            series: expectedSeries,
          }),
        );
      });
    });

    it.each([
      {
        from: CostBasis.USD,
        to: CostBasis.PercentGDP,
        yAxisTitle: "Losses as % of GDP",
        expectedSeries: expectedUndiffedPercentGDPSeries,
      },
      {
        from: CostBasis.PercentGDP,
        to: CostBasis.USD,
        yAxisTitle: "Losses in billions USD",
        expectedSeries: expectedUndiffedUSDSeries,
      },
    ])("should update the chart when changing cost basis from $from to $to", async ({ from, to, yAxisTitle, expectedSeries }) => {
      const piniaMock = pinia(from);
      setActivePinia(piniaMock);
      const appStore = useAppStore(piniaMock);
      await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [piniaMock] }, props: { diffing: false } });

      appStore.preferences.costBasis = to;

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            yAxis: expect.objectContaining({
              title: expect.objectContaining({ text: yAxisTitle }),
            }),
            series: expectedSeries,
          }),
        );
      });
    });
  });

  describe("when in diffing mode", () => {
    it.each([
      {
        costBasis: CostBasis.PercentGDP,
        yAxisTitle: "Relative losses as % of GDP",
        expectedSeries: expectedDiffedPercentGDPSeries,
      },
      {
        costBasis: CostBasis.USD,
        yAxisTitle: "Relative losses in billions USD",
        expectedSeries: expectedDiffedUSDSeries,
      },
    ])("should initialise the chart with correct options for cost basis of $costBasis", async ({ costBasis, yAxisTitle, expectedSeries }) => {
      const chartSpy = vi.spyOn(Highcharts, "chart");

      await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(costBasis)] }, props: { diffing: true } });

      await waitFor(() => {
        expect(chartSpy).toHaveBeenCalledWith(
          "compareCostsChartContainer",
          expect.objectContaining({
            chart: expect.objectContaining({ height: 500, style: { fontFamily: "ImperialSansText, sans-serif" } }),
            title: expect.objectContaining({ text: "Losses relative to baseline after 599 days" }),
            exporting: expect.objectContaining({
              filename: "Losses relative to baseline after 599 days",
            }),
            xAxis: expect.objectContaining({
              categories: expect.arrayContaining(["low"]),
              title: expect.objectContaining({ text: "Global vaccine investment" }),
            }),
            yAxis: expect.objectContaining({
              min: undefined,
              plotLines: [expect.objectContaining({ value: 0 })],
              title: expect.objectContaining({ text: yAxisTitle }),
            }),
            series: expectedSeries,
          }),
        );
      });
    });

    it.each([
      {
        from: CostBasis.USD,
        to: CostBasis.PercentGDP,
        yAxisTitle: "Relative losses as % of GDP",
        expectedSeries: expectedDiffedPercentGDPSeries,
      },
      {
        from: CostBasis.PercentGDP,
        to: CostBasis.USD,
        yAxisTitle: "Relative losses in billions USD",
        expectedSeries: expectedDiffedUSDSeries,
      },
    ])("should update the chart when changing cost basis from $from to $to", async ({ from, to, yAxisTitle, expectedSeries }) => {
      const piniaMock = pinia(from);
      setActivePinia(piniaMock);
      const appStore = useAppStore(piniaMock);
      await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [piniaMock] }, props: { diffing: true } });

      appStore.preferences.costBasis = to;

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            yAxis: expect.objectContaining({
              title: expect.objectContaining({ text: yAxisTitle }),
            }),
            series: expectedSeries,
          }),
        );
      });
    });
  });

  it.each([
    {
      costBasis: CostBasis.PercentGDP,
      yAxisTitleSegment: "as % of GDP",
      expectedSeries: [expectedDiffedPercentGDPSeries, expectedUndiffedPercentGDPSeries],
    },
    {
      costBasis: CostBasis.USD,
      yAxisTitleSegment: "in billions USD",
      expectedSeries: [expectedDiffedUSDSeries, expectedUndiffedUSDSeries],
    },
  ])("should update the chart when changing into and out of diffing mode", async ({ costBasis, yAxisTitleSegment, expectedSeries }) => {
    const piniaMock = pinia(costBasis);
    setActivePinia(piniaMock);
    const component = await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [piniaMock] }, props: { diffing: false } });

    await component.setProps({ diffing: true });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          exporting: {
            filename: "Losses relative to baseline after 599 days",
          },
          title: expect.objectContaining({ text: "Losses relative to baseline after 599 days" }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["low"]),
          }),
          yAxis: expect.objectContaining({
            min: undefined,
            plotLines: [expect.objectContaining({ value: 0 })],
            title: expect.objectContaining({ text: `Relative losses ${yAxisTitleSegment}` }),
          }),
          series: expectedSeries[0],
        }),
      );
    });

    await component.setProps({ diffing: false });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          exporting: {
            filename: "Losses after 599 days",
          },
          title: expect.objectContaining({ text: "Losses after 599 days" }),
          xAxis: expect.objectContaining({
            categories: expect.arrayContaining(["high", "low"]),
          }),
          yAxis: expect.objectContaining({
            min: 0,
            plotLines: [],
            title: expect.objectContaining({ text: `Losses ${yAxisTitleSegment}` }),
          }),
          series: expectedSeries[1],
        }),
      );
    });
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(CostBasis.PercentGDP)] }, props: { diffing: false } });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    vi.useFakeTimers();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(CostBasis.PercentGDP)] }, props: { diffing: false } });

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    window.dispatchEvent(new Event("resize"));

    vi.advanceTimersByTime(25);

    expect(mockSetSize).toHaveBeenCalledWith(-24, 500, expect.objectContaining({ duration: 250 }));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    vi.useRealTimers();
  });
});
