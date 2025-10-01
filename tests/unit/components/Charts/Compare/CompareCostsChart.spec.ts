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
highVaccineScenario.parameters = { vaccine: "high" };
highVaccineScenario.result.data = mockResultResponseData as ScenarioResultData;
const lowVaccineScenario = structuredClone(highVaccineScenario);
lowVaccineScenario.parameters.vaccine = "low";
lowVaccineScenario.result.data.costs = [
  {
    id: "total",
    value: 60000,
    children: [
      { id: "gdp", value: 10000 },
      { id: "education", value: 20000 },
      { id: "life_years", value: 30000 },
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

const expectedPercentGDPSeries = [
  expect.objectContaining({
    name: "GDP",
    data: [
      expect.objectContaining({ name: "GDP", y: 32.87931628748886 }),
      expect.objectContaining({ name: "GDP", y: 0.050344764471232505 }),
    ],
  }),
  expect.objectContaining({
    name: "Education",
    data: [
      expect.objectContaining({ name: "Education", y: 7.74667209175136 }),
      expect.objectContaining({ name: "Education", y: 0.10068952894246501 }),
    ],
  }),
  expect.objectContaining({
    name: "Life years",
    data: [
      expect.objectContaining({ name: "Life years", y: 4.305661740495233 }),
      expect.objectContaining({ name: "Life years", y: expect.closeTo(0.151, 0.001) }),
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
      global: { stubs, plugins: [pinia(CostBasis.USD)] },
    });

    const container = component.find(`#compareCostsChartContainer`);
    expect(container.exists()).toBe(true);
  });

  it.each([
    {
      costBasis: CostBasis.PercentGDP,
      yAxisTitle: "Losses as % of GDP",
      expectedSeries: expectedPercentGDPSeries,
    },
    {
      costBasis: CostBasis.USD,
      yAxisTitle: "Losses in billions USD",
      expectedSeries: expectedUSDSeries,
    },
  ])("should initialise the chart with correct options for cost basis of $costBasis", async ({ costBasis, yAxisTitle, expectedSeries }) => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(costBasis)] } });

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
          yAxis: expect.objectContaining({ title: expect.objectContaining({ text: yAxisTitle }) }),
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
      expectedSeries: expectedPercentGDPSeries,
    },
    {
      from: CostBasis.PercentGDP,
      to: CostBasis.USD,
      yAxisTitle: "Losses in billions USD",
      expectedSeries: expectedUSDSeries,
    },
  ])("should update the chart when changing cost basis from $from to $to", async ({ from, to, yAxisTitle, expectedSeries }) => {
    const piniaMock = pinia(from);
    setActivePinia(piniaMock);
    const appStore = useAppStore(piniaMock);
    await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [piniaMock] } });

    appStore.preferences.costBasis = to;

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          yAxis: expect.objectContaining({ title: expect.objectContaining({ text: yAxisTitle }) }),
          series: expectedSeries,
        }),
      );
    });
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(CostBasis.PercentGDP)] } });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    vi.useFakeTimers();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(CompareCostsChart, { global: { stubs, plugins: [pinia(CostBasis.PercentGDP)] } });

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
