import type { ScenarioResultData } from "@/types/apiResponseTypes";
import type { VueWrapper } from "@vue/test-utils";
import CostsCard from "@/components/CostsCard.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "@/tests/unit/mocks/mockResultResponseData";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { mockResizeObserver } from "jsdom-testing-mocks";

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

const mockSetSize = vi.fn();
vi.mock("highcharts", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    getOptions: actual.getOptions,
    chart: () => ({
      destroy: vi.fn(),
      setSize: mockSetSize,
      series: [{ setData: vi.fn() }],
    }),
    _modules: actual._modules,
    win: actual.win,
  };
});

const resizeObserver = mockResizeObserver();

const setupResizeObserverMock = async (component: VueWrapper) => {
  const totalsContainerEl = component.find(`#totalsContainer`).element as HTMLElement;
  resizeObserver.mockElementSize(totalsContainerEl, { contentBoxSize: { inlineSize: 500 } });
  resizeObserver.resize(totalsContainerEl);
  await waitFor(() => {
    expect(component.find(`#costsChartContainer`)).not.toBeNull();
  });
};

describe("costs card", () => {
  it("should render the costs pie chart container and the total cost", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    await setupResizeObserverMock(component);
    const container = component.find(`#costsPieContainer`);
    expect(container.classes()).not.toContain("hide-tooltips");

    const totalCostPara = component.find(`p#totalCostPara`);
    expect(totalCostPara.text()).toBe("1.1T");
  });

  it("should show the tooltips when the mouse is over the cost pie container, and not otherwise", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    await setupResizeObserverMock(component);

    const costsPieComponent = component.findComponent({ name: "CostsPie" });
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

  it("should render the costs pie chart container with the correct style and size, and resize it when elements are resized", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    await setupResizeObserverMock(component);

    const costsContainer = component.find(`#costsPieContainer`);
    const costsPie = component.findComponent({ name: "CostsPie" });

    await waitFor(() => {
      // 300px is 60% of 500px
      expect(costsContainer.attributes("style")).toContain("height: 300px; width: 300px;");
      expect(costsPie.props().pieSize).toBe(300);
    });

    const totalsContainerEl = component.find(`#totalsContainer`).element as HTMLElement;

    resizeObserver.mockElementSize(totalsContainerEl, { contentBoxSize: { inlineSize: 1000 } });
    resizeObserver.resize(totalsContainerEl);

    await waitFor(() => {
      // 600px is 60% of 1000px
      expect(costsContainer.attributes("style")).toContain("height: 600px; width: 600px;");
      expect(costsPie.props().pieSize).toBe(600);
    });
  });
});
