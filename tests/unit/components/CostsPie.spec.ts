import type { AsyncDataRequestStatus } from "#app";
import type { ScenarioResultData } from "@/types/apiResponseTypes";
import CostsPie from "@/components/CostsPie.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import * as Highcharts from "highcharts";
import { mockResultResponseData } from "../mocks/mockResponseData";

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
  { id: "total", name: "Total", parent: "", value: 8924791.0069 },
  { id: "gdp", name: "GDP", parent: "total", value: 6530831.2856 },
  { id: "education", name: "Education", parent: "total", value: 1538724.4678 },
  { id: "life_years", name: "Life years", parent: "total", value: 855235.2535 },
  { id: "gdp_closures", name: "Closures", parent: "gdp", value: 6329062.9268 },
  { id: "gdp_absences", name: "Absences", parent: "gdp", value: 201768.3587 },
  { id: "education_closures", name: "Closures", parent: "education", value: 1535578.3603 },
  { id: "education_absences", name: "Absences", parent: "education", value: 3146.1076 },
  { id: "life_years_pre_school", name: "Preschool-age children", parent: "life_years", value: 333.825 },
  { id: "life_years_school_age", name: "School-age children", parent: "life_years", value: 648858.7066 },
  { id: "life_years_working_age", name: "Working-age adults", parent: "life_years", value: 30637.374 },
  { id: "life_years_retirement_age", name: "Retirement-age adults", parent: "life_years", value: 175405.3478 },
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

describe("costs pie", () => {
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
      global: { stubs, plugins: [mockPinia({}, true, { stubActions: false })] },
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
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithCostData }, true, { stubActions: false })] },
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
