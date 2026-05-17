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
    const costsTable = component.find('[data-testid="costs-table"]');
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

  it("should show the life years total and hide the USD total when in life years metric mode", async () => {
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = LIFE_YEARS_METRIC;

    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });

    expect(component.find("#lifeYearsContainer").exists()).toBe(true);
    expect(component.find("#gdpContainer").exists()).toBe(false);
    expect(component.find("#usdContainer").exists()).toBe(false);

    const totalHeading = component.find("#totalHeading");
    expect(totalHeading.text()).toBe("Life years lost");

    // Life years total should be formatted
    const lifeYearsTotalCost = component.find("#lifeYearsTotalCost");
    expect(lifeYearsTotalCost.exists()).toBe(true);
    expect(lifeYearsTotalCost.text()).not.toBe("");
  });

  it("should show 'Total' heading and the metric toggler switch in USD mode", async () => {
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = USD_METRIC;

    const component = await mountSuspended(CostsPanel, { global: { stubs, plugins: [pinia] } });

    const totalHeading = component.find("#totalHeading");
    expect(totalHeading.text()).toBe("Total");

    const metricSwitch = component.find("#costMetricSwitch");
    expect(metricSwitch.exists()).toBe(true);
  });
});
