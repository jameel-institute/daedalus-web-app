import type { ScenarioResultData } from "@/types/apiResponseTypes";
import CostsCard from "@/components/CostsCard.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";

const stubs = {
  CIcon: true,
};
const plugins = [mockPinia(
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
)];

vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: vi.fn(),
      setSize: vi.fn(),
      update: vi.fn(),
      series: [{ setData: vi.fn() }],
    }),
  };
});

describe("costs card", () => {
  it("should render the costs chart container, the total cost, costs table, vsl and total cost in terms of % of GDP", async () => {
    const averageVsl = formatCurrency(mockResultResponseData.average_vsl);
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });

    const container = component.find(`#costsChartContainer`);
    expect(container.classes()).not.toContain("hide-tooltips");

    expect(component.find(`#gdpContainer`).text()).toContain("44.9%");

    const totalCostPara = component.find(`p#totalCostPara`);

    const costsTable = component.find('[data-testid="costsTable"]');
    expect(costsTable).toBeTruthy();

    expect(component.text()).toContain(averageVsl);
    expect(totalCostPara.text()).toBe("8.9T");
  });

  it("should change the cost basis when the toggle is clicked", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });

    const costsTableComponent = component.findComponent({ name: "CostsTable" });
    expect(costsTableComponent.props("basis")).toBe(CostBasis.USD);

    const switchComponent = component.findComponent({ name: "CFormSwitch" });
    switchComponent.vm.$emit("update:modelValue", true);

    await nextTick();

    expect(costsTableComponent.props("basis")).toBe(CostBasis.PercentGDP);
  });
});
