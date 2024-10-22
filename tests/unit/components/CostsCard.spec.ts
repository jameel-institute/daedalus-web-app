import type { ScenarioResultData } from "@/types/apiResponseTypes";
import CostsCard from "@/components/CostsCard.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { mockResultResponseData } from "../mocks/mockResponseData";

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
)];

vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: vi.fn(),
      setSize: vi.fn(),
      series: [{ setData: vi.fn() }],
    }),
    _modules: actual._modules,
    win: actual.win,
  };
});

describe("costs card", () => {
  it("should render the costs pie chart container, costs table and the total cost", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });

    const container = component.find(`#costsPieContainer`);
    expect(container.classes()).not.toContain("hide-tooltips");

    const totalCostPara = component.find(`p#totalCostPara`);
    expect(totalCostPara.text()).toBe("1.1T");

    const costsTable = component.find('[data-testid="costsTable"]');
    expect(costsTable).toBeTruthy();
  });

  it("should show the tooltips when the mouse is over the cost pie container, and not otherwise", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });

    const costsPieComponent = component.findComponent({ name: "CostsPie.client" });
    expect(costsPieComponent.props().hideTooltips).toBe(false);

    const container = component.find(`#costsPieContainer`);

    await container.trigger("mouseover");
    expect(costsPieComponent.props().hideTooltips).toBe(false);

    await container.trigger("mouseleave");
    await waitFor(() => {
      expect(costsPieComponent.props().hideTooltips).toBe(true);
    }, { timeout: 1000 });

    await container.trigger("mouseover");
    expect(costsPieComponent.props().hideTooltips).toBe(false);
  });
});
