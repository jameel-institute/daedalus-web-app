import type { ScenarioResultData } from "~/types/apiResponseTypes";
import CostsCard from "@/components/CostsCard.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { setActivePinia } from "pinia";

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

  it("should render the costs chart container, the total cost, costs table, vsl and total cost in terms of % of GDP", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins: [pinia] } });

    expect(component.find(`#gdpContainer`).text()).toContain("44.9%");

    const totalCostPara = component.find(`p#totalCostPara`);

    const costsTable = component.find('[data-testid="costsTable"]');
    expect(costsTable).toBeTruthy();

    expect(component.text()).toContain("2,799,263"); // VSL in Int'l$
    expect(totalCostPara.text()).toBe("8.9T");
  });

  it("should change the cost basis when the radio buttons are clicked", async () => {
    const appStore = useAppStore();
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins: [pinia] } });

    expect(appStore.preferences.costBasis).toBe(CostBasis.USD);

    const gdpRadioButton = component.find(`input[type="radio"][value="${CostBasis.PercentGDP}"]`);
    const usdRadioButton = component.find(`input[type="radio"][value="${CostBasis.USD}"]`);
    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);

    await gdpRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(true);
    expect(usdRadioButton.element.checked).toBe(false);
    expect(appStore.preferences.costBasis).toBe(CostBasis.PercentGDP);

    await usdRadioButton.setChecked();

    expect(gdpRadioButton.element.checked).toBe(false);
    expect(usdRadioButton.element.checked).toBe(true);
    expect(appStore.preferences.costBasis).toBe(CostBasis.USD);
  });
});
