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

const setupResizeObserverMock = async (
  costsPiePosition: "top-right-corner" | "below-usd-total-cost" | "bottom-right-corner",
  component: VueWrapper,
  cardBodyEl: HTMLElement,
  totalsContainerEl: HTMLElement,
  gdpContainerEl: HTMLElement,
  usdContainerEl: HTMLElement,
) => {
  /* For these tests we'll construct examples of layouts with various element sizes, depicted
  for convenience like the below, where each [ ] stands for an area of 100px by 100px. This
  lets us test the calculation of the size and position of the costs pie chart container.

  [ ][ ][ ][ ]
  [ ][ ][ ][ ]
  [ ][ ][ ][ ]
  [ ][ ][ ][ ]
  [ ][ ][ ][ ]

  KEY:
    [ ] = empty space
    [t] = 'TOTAL' heading
    [g] = GDP container
    [u] = USD container
    [p] = Square containing pie chart
  */

  if (costsPiePosition === "top-right-corner") {
    /*

    [t][t][ ][p][p][p][p][ ]
    [g][g][ ][p][p][p][p][ ]
    [u][ ][ ][p][p][p][p][ ]
    [ ][ ][ ][p][p][p][p][ ]

    */

    // blockSize corresponds to height; inlineSize to width
    resizeObserver.mockElementSize(cardBodyEl, {
      contentBoxSize: { inlineSize: 800, blockSize: 400 },
    });
    resizeObserver.mockElementSize(totalsContainerEl, {
      contentBoxSize: { inlineSize: 200, blockSize: 300 },
    });
    resizeObserver.mockElementSize(gdpContainerEl, {
      contentBoxSize: { inlineSize: 200, blockSize: 100 },
    });
    resizeObserver.mockElementSize(usdContainerEl, {
      contentBoxSize: { inlineSize: 100, blockSize: 100 },
    });
  } else if (costsPiePosition === "below-usd-total-cost") {
    /*

    [t][t][t][ ]
    [g][g][g][ ]
    [u][u][u][ ]
    [ ][p][p][ ]
    [ ][p][p][ ]

    */
    resizeObserver.mockElementSize(cardBodyEl, {
      contentBoxSize: { inlineSize: 400, blockSize: 500 },
    });
    resizeObserver.mockElementSize(totalsContainerEl, {
      contentBoxSize: { inlineSize: 300, blockSize: 300 },
    });
    resizeObserver.mockElementSize(gdpContainerEl, {
      contentBoxSize: { inlineSize: 300, blockSize: 100 },
    });
    resizeObserver.mockElementSize(usdContainerEl, {
      contentBoxSize: { inlineSize: 300, blockSize: 100 },
    });
  } else if (costsPiePosition === "bottom-right-corner") {
    /*

    [t][t][t][ ][ ]
    [g][g][g][ ][ ]
    [u][u][p][p][p]
    [ ][ ][p][p][p]
    [ ][ ][p][p][p]

    */
    resizeObserver.mockElementSize(cardBodyEl, {
      contentBoxSize: { inlineSize: 500, blockSize: 500 },
    });
    resizeObserver.mockElementSize(totalsContainerEl, {
      contentBoxSize: { inlineSize: 300, blockSize: 300 },
    });
    resizeObserver.mockElementSize(gdpContainerEl, {
      contentBoxSize: { inlineSize: 300, blockSize: 100 },
    });
    resizeObserver.mockElementSize(usdContainerEl, {
      contentBoxSize: { inlineSize: 200, blockSize: 200 },
    });
  }

  resizeObserver.resize(totalsContainerEl);
  resizeObserver.resize(cardBodyEl);
  resizeObserver.resize(gdpContainerEl);
  resizeObserver.resize(usdContainerEl);
};

describe("costs card", () => {
  it("should render the costs pie chart container, the total cost, and total cost in terms of % of GDP", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    const cardBodyEl = component.find(`#costsCardBody`).element as HTMLElement;
    const totalsContainerEl = component.find(`#totalsContainer`).element as HTMLElement;
    const gdpContainerEl = component.find(`#gdpContainer`).element as HTMLElement;
    const usdContainerEl = component.find(`#usdContainer`).element as HTMLElement;

    await setupResizeObserverMock("top-right-corner", component, cardBodyEl, totalsContainerEl, gdpContainerEl, usdContainerEl);

    await waitFor(() => {
      expect(component.find(`#costsPieContainer`)).not.toBeNull();
    });

    const container = component.find(`#costsPieContainer`);
    expect(container.classes()).not.toContain("hide-tooltips");

    expect(component.find(`p#totalCostPara`).text()).toBe("1.1T");

    expect(component.find(`#gdpContainer`).text()).toContain("42.6%");
  });

  it("should show the tooltips when the mouse is over the cost pie container, and not otherwise", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    const cardBodyEl = component.find(`#costsCardBody`).element as HTMLElement;
    const totalsContainerEl = component.find(`#totalsContainer`).element as HTMLElement;
    const gdpContainerEl = component.find(`#gdpContainer`).element as HTMLElement;
    const usdContainerEl = component.find(`#usdContainer`).element as HTMLElement;

    await setupResizeObserverMock("top-right-corner", component, cardBodyEl, totalsContainerEl, gdpContainerEl, usdContainerEl);

    await waitFor(() => {
      expect(component.find(`#costsPieContainer`)).not.toBeNull();
    });

    const container = component.find(`#costsPieContainer`);
    container.trigger("mouseenter");
    expect(container.classes()).not.toContain("hide-tooltips");
    container.trigger("mouseleave");
    await waitFor(() => {
      expect(container.classes()).toContain("hide-tooltips");
    });
  });

  it("should render the costs pie chart container with the correct class, size, and position, and resize it when elements are resized", async () => {
    const component = await mountSuspended(CostsCard, { global: { stubs, plugins } });
    const cardBodyEl = component.find(`#costsCardBody`).element as HTMLElement;
    const totalsContainerEl = component.find(`#totalsContainer`).element as HTMLElement;
    const gdpContainerEl = component.find(`#gdpContainer`).element as HTMLElement;
    const usdContainerEl = component.find(`#usdContainer`).element as HTMLElement;

    await setupResizeObserverMock("top-right-corner", component, cardBodyEl, totalsContainerEl, gdpContainerEl, usdContainerEl);

    const costsContainer = component.find(`#costsPieContainer`);
    const costsPie = component.findComponent({ name: "CostsPie" });

    await waitFor(() => {
      expect(costsContainer.attributes("style")).toContain("height: 400px; right: 100px; top: 0px; width: 400px;");
      expect(costsPie.props().pieSize).toBe(400);
    });

    await setupResizeObserverMock("below-usd-total-cost", component, cardBodyEl, totalsContainerEl, gdpContainerEl, usdContainerEl);
    await waitFor(() => {
      expect(costsContainer.attributes("style")).toContain("height: 200px; right: 100px; width: 200px; bottom: 0px;");
      expect(costsPie.props().pieSize).toBe(200);
    });

    await setupResizeObserverMock("bottom-right-corner", component, cardBodyEl, totalsContainerEl, gdpContainerEl, usdContainerEl);
    await waitFor(() => {
      expect(costsContainer.attributes("style")).toContain("height: 300px; right: 0px; width: 300px; bottom: 0px;");
      expect(costsPie.props().pieSize).toBe(300);
    });
  });
});
