import type { AsyncDataRequestStatus } from "#app";
import type { ScenarioResultData } from "@/types/apiResponseTypes";
import CostsPie from "@/components/CostsPie.vue";
import { emptyScenario, mockedMetadata, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResultResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import * as Highcharts from "highcharts";

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
const expectedCostData = [
  { id: "total", name: "Total", parent: "", value: 1086625.0137 },
  { id: "gdp", name: "GDP", parent: "total", value: 52886.8372 },
  { id: "education", name: "Education", parent: "total", value: 4154.9456 },
  { id: "life_years", name: "Life years", parent: "total", value: 1029583.2309 },
  { id: "gdp_absences", name: "Absences", parent: "gdp", value: 52886.8372 },
  { id: "education_absences", name: "Absences", parent: "education", value: 4154.9456 },
  { id: "life_years_infants", name: "Infants", parent: "life_years", value: 882.054 },
  { id: "life_years_adolescents", name: "Adolescents", parent: "life_years", value: 33273.6856 },
  { id: "life_years_working_age", name: "Working-age adults", parent: "life_years", value: 993899.3885 },
  { id: "life_years_retirement_age", name: "Retirement-age adults", parent: "life_years", value: 1528.1028 },
];

const mockSetSize = vi.fn();
const mockDestroy = vi.fn();
const mockSetData = vi.fn();
const mockChart = {
  destroy: mockDestroy,
  setSize: mockSetSize,
  showResetZoom: vi.fn(),
  series: [{ setData: mockSetData }],
};
vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => mockChart,
    charts: actual.charts,
    _modules: actual._modules,
    win: actual.win,
    Pointer: actual.Pointer,
  };
});

describe("costs card", () => {
  it("should render the costs pie chart container", async () => {
    const component = await mountSuspended(CostsPie, {
      global: { stubs, plugins: [mockPinia()] },
      props: { hideTooltips: false },
    });

    const container = component.find(`#costsChartContainer`);
    expect(container.classes()).not.toContain("hide-tooltips");

    component.setProps({ hideTooltips: true });

    await nextTick();

    expect(container.classes()).toContain("hide-tooltips");
  });

  it("should populate the cost data into the chart when the data is loaded after the component is mounted", async () => {
    await mountSuspended(CostsPie, {
      global: { stubs, plugins: [mockPinia({ metadata: mockedMetadata }, true, false)] },
      props: { hideTooltips: false },
    });

    const store = useAppStore();
    store.currentScenario = scenarioWithCostData;

    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expectedCostData);
    });
  });

  it("should populate the cost data into the chart when the data is loaded before the component is mounted", async () => {
    await mountSuspended(CostsPie, {
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithCostData }, true, false)] },
      props: { hideTooltips: false },
    });

    await waitFor(() => {
      expect(mockSetData).toHaveBeenCalledWith(expectedCostData);
    });
  });

  it("should set pie size depending on screen size", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");
    const testPinia = mockPinia();
    const appStore = useAppStore(testPinia);
    await mountSuspended(CostsPie, {
      global: { stubs, plugins: [testPinia] },
      props: { hideTooltips: false },
    });

    expect(chartSpy).toHaveBeenCalledWith(
      "costsChartContainer",
      expect.objectContaining({
        chart: expect.objectContaining({
          height: 450,
          width: 450,
        }),
      }),
    );
    appStore.largeScreen = false;

    await flushPromises();

    expect(mockSetSize).toHaveBeenCalledWith(300, 300, expect.any(Object));
  });

  it("should initialise the chart with the correct options", async () => {
    const chartSpy = vi.spyOn(Highcharts, "chart");

    await mountSuspended(CostsPie, {
      global: { stubs, plugins: [mockPinia()] },
      props: { hideTooltips: false },
    });

    expect(chartSpy).toHaveBeenCalledWith(
      "costsChartContainer",
      expect.objectContaining({
        chart: expect.objectContaining({
          height: 450,
          width: 450,
        }),
        colors: expect.arrayContaining([expect.stringContaining("rgba")]),
        series: expect.arrayContaining([
          expect.objectContaining({
            data: [], // Empty at initialisation
            levels: expect.arrayContaining([
              expect.objectContaining({
                level: 3,
                dataLabels: expect.objectContaining({
                  enabled: false, // Initialise data labels as disabled for the outermost circle
                }),
              }),
            ]),
          }),
        ]),
        tooltip: expect.objectContaining({
          pointFormatter: expect.any(Function),
        }),
      }),
    );
  });

  it("should destroy the chart when the component is unmounted", async () => {
    const component = await mountSuspended(CostsPie, {
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithCostData })] },
      props: { hideTooltips: false, pieSize: 100 },
    });

    component.unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });
});
