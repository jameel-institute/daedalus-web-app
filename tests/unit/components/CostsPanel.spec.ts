import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CostsPanel from "~/components/CostsPanel.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { setActivePinia } from "pinia";
import { CostBasis } from "~/types/unitTypes";

const stubs = {
  CIcon: true,
};
const pinia = mockPinia(
  {
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
  },
  true,
  { stubActions: false },
);

vi.mock("highcharts/esm/highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    default: {
      getOptions: actual.default.getOptions,
      HTMLElement: { useForeignObject: undefined },
      chart: () => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
        update: vi.fn(),
        series: [{ setData: vi.fn() }],
      }),
    },
  };
});
vi.mock("highcharts/esm/modules/accessibility", () => ({}));
vi.mock("highcharts/esm/modules/exporting", () => ({}));
vi.mock("highcharts/esm/modules/export-data", () => ({}));
vi.mock("highcharts/esm/modules/offline-exporting", () => ({}));

describe("costs card", () => {
  beforeEach(() => {
    setActivePinia(pinia);
  });

  it("should render the costs chart and costs table in USD metric mode", async () => {
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = USD_METRIC;

    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });
    expect(component.text()).toContain("Losses after 599 days");
    expect(component.find(`#gdpContainer`).exists()).toBe(true);
    expect(component.find(`#gdpContainer`).text()).toContain("44.9%");

    const totalCostPara = component.find(`p#totalCostPara`);
    const costsTable = component.find('table[aria-label="Costs table"]');
    expect(costsTable.exists()).toBe(true);

    expect(totalCostPara.text()).toBe("8.9T");

    expect(appStore.preferences.costBasis).toBe(CostBasis.PercentGDP);

    const gdpRadioButton = component.find(`input[type="radio"][value="${CostBasis.PercentGDP}"]`);
    const usdRadioButton = component.find(`input[type="radio"][value="${CostBasis.USD}"]`);
    expect(gdpRadioButton.element.checked).toBe(true);
    expect(usdRadioButton.element.checked).toBe(false);

    await usdRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);
    expect(appStore.preferences.costBasis).toBe(CostBasis.USD);

    await gdpRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(true);
    expect(usdRadioButton.element.checked).toBe(false);
    expect(appStore.preferences.costBasis).toBe(CostBasis.PercentGDP);
  });

  it("should show the life years chart when the show-life-years switch is toggled on, alongside USD content", async () => {
    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });

    // USD content is always present
    expect(component.find("#gdpContainer").exists()).toBe(true);
    expect(component.find("#usdContainer").exists()).toBe(true);

    // Heading is always "Total"
    expect(component.find("#totalHeading").text()).toBe("Total");

    // Life years chart is hidden by default
    expect(component.find("#lifeYearsChartContainer").exists()).toBe(false);

    // Toggle on
    const metricSwitch = component.find<HTMLInputElement>("#costMetricSwitch");
    expect(metricSwitch.exists()).toBe(true);
    await metricSwitch.setValue(true);

    // USD content remains; life years chart now also shown
    expect(component.find("#gdpContainer").exists()).toBe(true);
    expect(component.find("#usdContainer").exists()).toBe(true);
    expect(component.find("#lifeYearsChartContainer").exists()).toBe(true);
  });

  it("should show 'Total' heading and the metric toggler switch", async () => {
    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });

    const totalHeading = component.find("#totalHeading");
    expect(totalHeading.text()).toBe("Total");

    const metricSwitch = component.find("#costMetricSwitch");
    expect(metricSwitch.exists()).toBe(true);
  });
});
