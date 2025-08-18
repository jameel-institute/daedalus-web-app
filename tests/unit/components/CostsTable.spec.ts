import CostsTable from "@/components/CostsTable.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { costAsPercentOfGdp } from "~/components/utils/formatters";
import type { ScenarioCost } from "~/types/resultTypes";
import type { AsyncDataRequestStatus } from "#app";

const stubs = {
  CIcon: true,
};

const expectedCostsForNoneScenario = [
  "6,531,000",
  "6,329,000",
  "202,000",
  "1,539,000",
  "1,536,000",
  "3,000",
  "855,000",
  "300",
  "649,000",
  "31,000",
  "175,000",
];
const noneScenario = {
  ...emptyScenario,
  parameters: { vaccine: "none" },
  result: {
    data: mockResultResponseData,
    fetchError: undefined,
    fetchStatus: "success" as AsyncDataRequestStatus,
  },
};

let originalBodyInnerHTML: string;
beforeEach(() => {
  originalBodyInnerHTML = document.body.innerHTML;
  vi.useFakeTimers();
});

afterEach(() => {
  document.body.innerHTML = originalBodyInnerHTML;
  vi.useRealTimers();
});

describe("costs table for the current scenario", () => {
  it("should render costs table correctly, when cost basis is USD", async () => {
    const pinia = mockPinia({
      currentScenario: structuredClone(noneScenario),
      preferences: {
        costBasis: CostBasis.USD,
      },
    }, true, { stubActions: false });
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [pinia],
      },
      props: { scenarios: [store.currentScenario] },
    });

    let componentText = component.text();

    expect(componentText).toContain("$, millions");

    expect(componentText).toContain("Expand all");
    expect(componentText).not.toContain("Collapse all");
    expect(componentText).not.toContain("Total");

    const expandButton = component.find("button[aria-label='Expand costs table']");
    await expandButton.trigger("click");

    componentText = component.text();

    expect(componentText).not.toContain("Expand all");
    expect(componentText).toContain("Collapse all");

    expectedCostsForNoneScenario.forEach(cost => expect(componentText).toContain(cost));

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers.length).toBe(1);
    expect(tooltipTriggers[0].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[0].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("Value of statistical life: 2,799,263 Int'l$");
  });

  it("should render costs table correctly, when cost basis is percent of GDP", async () => {
    const pinia = mockPinia({
      currentScenario: structuredClone(noneScenario),
      preferences: {
        costBasis: CostBasis.PercentGDP,
      },
    }, true, { stubActions: false });
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [pinia],
      },
      props: { scenarios: [store.currentScenario] },
    });

    const componentText = component.text();

    expect(componentText).toContain("% of 2018 GDP");
    expect(componentText).not.toContain("Total");

    mockResultResponseData.costs[0].children.forEach((cost) => {
      expect(componentText).toContain(costAsPercentOfGdp(cost.value, mockResultResponseData.gdp).toFixed(1));
      cost.children.forEach((subCost) => {
        expect(componentText).toContain(costAsPercentOfGdp(subCost.value, mockResultResponseData.gdp).toFixed(1));
      });
    });

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers.length).toBe(2);

    expect(tooltipTriggers[0].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[0].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("2018 GDP: 19,863,038 million USD");

    expect(tooltipTriggers[1].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[1].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("Value of statistical life: 2,799,263 Int'l$");
  });
});

describe("costs table for all scenarios in a comparison", () => {
  const recursivelyAddValue = (costs: ScenarioCost[], valueToAdd: number): ScenarioCost[] => {
    return costs.map(cost => ({
      ...cost,
      value: cost.value + valueToAdd,
      children: cost.children ? recursivelyAddValue(cost.children, valueToAdd) : undefined,
    }));
  };
  const mediumScenario = {
    ...structuredClone(emptyScenario),
    parameters: { vaccine: "medium" },
    result: {
      ...structuredClone(emptyScenario.result),
      data: {
        ...structuredClone(mockResultResponseData),
        parameters: { vaccine: "medium" },
        costs: recursivelyAddValue(mockResultResponseData.costs, 2000),
      },
    },
  };
  const expectedTotalForNoneScenario = "8,925,000";
  const expectedTotalForMediumScenario = "8,927,000";
  const expectedCostsForMediumScenario = [
    "6,533,000",
    "6,331,000",
    "204,000",
    "1,541,000",
    "1,538,000",
    "5,000",
    "857,000",
    "2,000",
    "651,000",
    "33,000",
    "177,000",
  ];

  it("should render costs table correctly, when cost basis is USD", async () => {
    const pinia = mockPinia({
      currentScenario: { ...emptyScenario },
      currentComparison: {
        axis: "vaccine",
        baseline: "medium",
        scenarios: [structuredClone(noneScenario), structuredClone(mediumScenario)],
      },
      preferences: {
        costBasis: CostBasis.USD,
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [pinia],
      },
      props: { scenarios: store.currentComparison.scenarios },
    });

    let componentText = component.text();

    expect(componentText).toContain("$, millions");

    // Scenario labels
    expect(componentText).toContain("None");
    expect(componentText).toContain("Medium (baseline)");

    expect(componentText).toContain("Expand all");
    expect(componentText).not.toContain("Collapse all");

    const expandButton = component.find("button[aria-label='Expand costs table']");
    await expandButton.trigger("click");

    componentText = component.text();

    expect(componentText).not.toContain("Expand all");
    expect(componentText).toContain("Collapse all");

    expect(componentText).toContain("Total");
    expect(componentText).toContain(expectedTotalForNoneScenario);
    expect(componentText).toContain(expectedTotalForMediumScenario);

    [...expectedCostsForNoneScenario, ...expectedCostsForMediumScenario].forEach((cost) => {
      expect(componentText).toContain(cost);
    });

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers.length).toBe(1);
    expect(tooltipTriggers[0].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[0].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("Value of statistical life: 2,799,263 Int'l$");
  });

  it("should render costs table correctly, when cost basis is percent of GDP", async () => {
    const pinia = mockPinia({
      currentScenario: { ...emptyScenario },
      currentComparison: {
        axis: "vaccine",
        baseline: "medium",
        scenarios: [structuredClone(noneScenario), structuredClone(mediumScenario)],
      },
      preferences: {
        costBasis: CostBasis.PercentGDP,
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [pinia],
      },
      props: { scenarios: store.currentComparison.scenarios },
    });

    const componentText = component.text();

    expect(componentText).toContain("% of 2018 GDP");

    // Scenario labels
    expect(componentText).toContain("None");
    expect(componentText).toContain("Medium");

    expect(componentText).toContain("Total");
    mockResultResponseData.costs.forEach((totalCost) => {
      expect(componentText).toContain(costAsPercentOfGdp(totalCost.value, mockResultResponseData.gdp).toFixed(1));
      expect(componentText).toContain(costAsPercentOfGdp(totalCost.value + 2000, mockResultResponseData.gdp).toFixed(1));
      totalCost.children.forEach((cost) => {
        expect(componentText).toContain(costAsPercentOfGdp(cost.value, mockResultResponseData.gdp).toFixed(1));
        expect(componentText).toContain(costAsPercentOfGdp(cost.value + 2000, mockResultResponseData.gdp).toFixed(1));
        cost.children.forEach((subCost) => {
          expect(componentText).toContain(costAsPercentOfGdp(subCost.value + 2000, mockResultResponseData.gdp).toFixed(1));
        });
      });
    });

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers.length).toBe(2);

    expect(tooltipTriggers[0].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[0].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("2018 GDP: 19,863,038 million USD");

    expect(tooltipTriggers[1].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[1].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(document.body.innerHTML).toContain("Value of statistical life: 2,799,263 Int'l$");
  });

  it("should render tooltips with multiple values for VSL and GDP, when these values vary between scenarios", async () => {
    const pinia = mockPinia({
      currentScenario: { ...emptyScenario },
      currentComparison: {
        axis: "country",
        baseline: "medium",
        scenarios: [{
          ...structuredClone(noneScenario),
          parameters: { country: "GBR" },
        }, {
          ...structuredClone(noneScenario),
          parameters: { country: "USA" },
          result: {
            ...structuredClone(emptyScenario.result),
            data: {
              ...structuredClone(mockResultResponseData),
              parameters: { country: "USA" },
              gdp: 987654321,
              average_vsl: 123456789,
            },
          },
        }],
      },
      preferences: {
        costBasis: CostBasis.PercentGDP,
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });
    const store = useAppStore(pinia);

    const component = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [pinia],
      },
      props: { scenarios: store.currentComparison.scenarios },
    });

    const tooltipTriggers = component.findAll("img");
    expect(tooltipTriggers.length).toBe(2);

    expect(tooltipTriggers[0].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[0].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    let innerHTML = document.body.innerHTML;
    expect(innerHTML).toContain("2018 GDP:");
    expect(innerHTML).toContain("<li>United Kingdom: 19,863,038 million USD</li>");
    expect(innerHTML).toContain("<li>United States: 987,654,321 million USD</li>");

    expect(tooltipTriggers[1].attributes("src")).toBe("/icons/info.svg");
    await tooltipTriggers[1].trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();
    innerHTML = document.body.innerHTML;
    expect(innerHTML).toContain("Value of statistical life:");
    expect(innerHTML).toContain("<li>United Kingdom: 2,799,263 Int'l$</li>");
    expect(innerHTML).toContain("<li>United States: 123,456,789 Int'l$</li>");
  });
});
