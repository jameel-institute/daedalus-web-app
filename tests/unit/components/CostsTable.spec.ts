import CostsTable from "@/components/CostsTable.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { costAsPercentOfGdp } from "~/components/utils/formatters";
import type { ScenarioCost } from "~/types/resultTypes";
import type { AsyncDataRequestStatus } from "#app";
import type { VueWrapper } from "@vue/test-utils";
import { CModal } from "#components";

const stubs = {
  CIcon: true,
};

const expectedCostsForNoneScenario = [
  "8,925,000",
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
const expectedLifeYearsNaturalUnitsCostsForNoneScenario = ["158.1M", "9.9M", "85.9M", "38.4M", "23.9M"];
const expectedDeathsForNoneScenario = "378.0K";

const expectedUKAverageVslText = "2,032,236 Int'l$";
const noneScenario = {
  ...emptyScenario,
  runId: "none-scenario-id",
  parameters: { vaccine: "none" },
  result: {
    data: mockResultResponseData,
    fetchError: undefined,
    fetchStatus: "success" as AsyncDataRequestStatus,
  },
};

const openVslModal = async (component: VueWrapper) => {
  const modalComponent = component.findComponent(CModal);
  expect(modalComponent.props("visible")).toBe(false);

  await component.find("#vslInfo").trigger("click");

  expect(modalComponent.props("visible")).toBe(true);
  return modalComponent.text();
};

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

    const headerText = component.find("thead").text();

    expect(headerText).toContain("$, millions");
    expect(headerText).toContain("Expand all");
    expect(headerText).not.toContain("Collapse all");

    expect(component.find("tbody tr").text()).toContain("Total losses");

    const rows = component.findAll("tbody tr");
    expectedCostsForNoneScenario.forEach((cost, index) => expect(rows[index].text()).toContain(cost));

    const deathRow = component.findAll("tbody tr")[expectedCostsForNoneScenario.length + 1].text();
    expect(deathRow).toContain("Deaths");
    expect(deathRow).toContain(expectedDeathsForNoneScenario);
    const lifeYearsNaturalUnitsRow = component.findAll("tbody tr")[expectedCostsForNoneScenario.length + 2].text();
    expect(lifeYearsNaturalUnitsRow).toContain("Life years lost");
    expectedLifeYearsNaturalUnitsCostsForNoneScenario.forEach((cost, index) => {
      const row = component.findAll("tbody tr")[index + expectedCostsForNoneScenario.length + 2];
      expect(row.text()).toContain(cost);
    });

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(expectedUKAverageVslText);

    expect(component.text()).not.toContain("+");
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

    expect(component.find("thead").text()).toContain("% of GDP");
    expect(component.find("tbody tr").text()).toContain("Total losses");

    const componentText = component.text();
    mockResultResponseData.costs[0].children.forEach((cost) => {
      const costUSD = cost.values.find(v => v.metric === USD_METRIC)?.value;
      expect(componentText).toContain(costAsPercentOfGdp(costUSD, mockResultResponseData.gdp).toFixed(1));
      cost.children.forEach((subCost) => {
        const subCostUSD = subCost.values.find(v => v.metric === USD_METRIC)?.value;
        expect(componentText).toContain(costAsPercentOfGdp(subCostUSD, mockResultResponseData.gdp).toFixed(1));
      });
    });

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(expectedUKAverageVslText);

    expect(componentText).not.toContain("+");
  });
});

describe("costs table for all scenarios in a comparison", () => {
  const recursivelyMultiplyValue = (costs: ScenarioCost[], factor: number): ScenarioCost[] => {
    return costs.map(cost => ({
      ...cost,
      values: cost.values.map(v => ({ ...v, value: v.value * factor })),
      children: cost.children ? recursivelyMultiplyValue(cost.children, factor) : undefined,
    }));
  };
  const differenceBetweenScenarios = 2;
  const mediumScenario = {
    ...structuredClone(emptyScenario),
    runId: "medium-scenario-id",
    parameters: { vaccine: "medium" },
    result: {
      ...structuredClone(emptyScenario.result),
      data: {
        ...structuredClone(mockResultResponseData),
        parameters: { vaccine: "medium" },
        costs: recursivelyMultiplyValue(mockResultResponseData.costs, differenceBetweenScenarios),
        time_series: {
          ...structuredClone(mockResultResponseData.time_series),
          dead: [
            ...structuredClone(mockResultResponseData.time_series.dead),
            12345,
          ],
        },
      },
    },
  };
  const expectedCostsForMediumScenario = [
    "17,850,000",
    "13,062,000",
    "12,658,000",
    "404,000",
    "3,077,000",
    "3,071,000",
    "6,000",
    "1,710,000",
    "700",
    "1,298,000",
    "61,000",
    "351,000",
  ];
  const expectedDeathsForMediumScenario = "12.3K";
  const expectedLifeYearsNaturalUnitsCostsForMediumScenario = [
    "316.2M",
    "19.9M",
    "171.8M",
    "76.8M",
    "47.7M",
  ];

  it("should render costs table correctly, when cost basis is USD, and NOT diffing", async () => {
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
      props: { diffing: false, scenarios: store.currentComparison.scenarios },
    });

    const headerText = component.find("thead").text();
    expect(headerText).toContain("$, millions");
    // Scenario labels
    expect(headerText).toContain("None");
    expect(headerText).toContain("Medium");

    expect(headerText).toContain("Expand all");
    expect(headerText).not.toContain("Collapse all");

    const expandButton = component.find("button[aria-label='Expand costs table']");
    await expandButton.trigger("click");

    const componentText = component.text();

    expect(componentText).not.toContain("Expand all");
    expect(componentText).toContain("Collapse all");

    expect(component.find("tbody tr").text()).toContain("Total losses");

    const baselineTdClass = "text-primary-emphasis";
    expectedCostsForNoneScenario.forEach((cost, index) => {
      const row = component.findAll("tbody tr")[index];
      expect(row.text()).toContain(cost);
      const td = row.findAll("td").find(td => td.text() === cost);
      expect(td).toBeDefined();
      expect(td!.classes()).not.toContain(baselineTdClass);
    });

    expectedCostsForMediumScenario.forEach((cost, index) => {
      const row = component.findAll("tbody tr")[index];
      expect(row.text()).toContain(cost);
      const td = row.findAll("td").find(td => td.text() === cost);
      expect(td).toBeDefined();
      expect(td!.classes()).toContain(baselineTdClass);
    });

    const rows = component.findAll("tbody tr");
    const deathRow = rows[expectedCostsForNoneScenario.length + 1].text();
    expect(deathRow).toContain("Deaths");
    expect(deathRow).toContain(expectedDeathsForNoneScenario);
    expect(deathRow).toContain(expectedDeathsForMediumScenario);
    const lifeYearsNaturalUnitsRow = rows[expectedCostsForNoneScenario.length + 2].text();
    expect(lifeYearsNaturalUnitsRow).toContain("Life years lost");
    expectedLifeYearsNaturalUnitsCostsForNoneScenario.forEach((cost, index) => {
      const rowText = rows[index + expectedCostsForNoneScenario.length + 2].text();
      expect(rowText).toContain(cost);
      expect(rowText).toContain(expectedLifeYearsNaturalUnitsCostsForMediumScenario[index]);
    });

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(expectedUKAverageVslText);

    expect(componentText).not.toContain("+");
  });

  it("should render costs table correctly, when cost basis is percent of GDP, and NOT diffing", async () => {
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
      props: { diffing: false, scenarios: store.currentComparison.scenarios },
    });

    const headerText = component.find("thead").text();
    expect(headerText).toContain("% of GDP");
    // Scenario labels
    expect(headerText).toContain("None");
    expect(headerText).toContain("Medium");

    const componentText = component.text();
    expect(component.find("tbody tr").text()).toContain("Total");
    mockResultResponseData.costs.forEach((totalCost) => {
      const totalCostUSD = totalCost.values.find(v => v.metric === USD_METRIC)!.value;
      expect(componentText).toContain(costAsPercentOfGdp(totalCostUSD, mockResultResponseData.gdp).toFixed(1));
      expect(componentText).toContain(costAsPercentOfGdp(totalCostUSD * differenceBetweenScenarios, mockResultResponseData.gdp).toFixed(1));
      totalCost.children.forEach((cost) => {
        const costUSD = cost.values.find(v => v.metric === USD_METRIC)!.value;
        expect(componentText).toContain(costAsPercentOfGdp(costUSD, mockResultResponseData.gdp).toFixed(1));
        expect(componentText).toContain(costAsPercentOfGdp(costUSD * differenceBetweenScenarios, mockResultResponseData.gdp).toFixed(1));
        cost.children.forEach((subCost) => {
          const subCostUSD = subCost.values.find(v => v.metric === USD_METRIC)!.value;
          expect(componentText).toContain(costAsPercentOfGdp(subCostUSD, mockResultResponseData.gdp).toFixed(1));
          expect(componentText).toContain(costAsPercentOfGdp(subCostUSD * differenceBetweenScenarios, mockResultResponseData.gdp).toFixed(1));
        });
      });
    });

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(expectedUKAverageVslText);

    expect(componentText).not.toContain("+");
  });

  it("should render costs table correctly, when cost basis is USD, and diffing mode is switched on", async () => {
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
      props: { diffing: true, scenarios: store.currentComparison.scenarios },
    });

    const headerText = component.find("thead").text();

    expect(headerText).toContain("$, millions");

    // Scenario labels
    expect(headerText).toContain("None");
    expect(headerText).not.toContain("Medium");

    const componentText = component.text();
    expect(component.find("tbody tr").text()).toContain("Net losses");
    let numberOfNegativeDifferences = 0;
    Array.from(componentText.matchAll(/-\d/g)).forEach(() => {
      numberOfNegativeDifferences++;
    });
    expect(numberOfNegativeDifferences).toEqual(expectedCostsForNoneScenario.length + expectedLifeYearsNaturalUnitsCostsForNoneScenario.length);

    const deathRow = component.findAll("tbody tr")[expectedCostsForNoneScenario.length + 1];
    expect(deathRow.text()).toContain("Deaths");
    expect(deathRow.text()).toContain("+365.6K"); // A positive difference including '+' sign

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(expectedUKAverageVslText);
  });

  it("should render modals with multiple values for VSL and GDP, when these values vary between scenarios", async () => {
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
              vsl: {
                average: 123456789,
                young: 999999999,
                old: 1,
              },
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
      props: { diffing: true, scenarios: store.currentComparison.scenarios },
    });

    const vslModalComponentText = await openVslModal(component);

    expect(vslModalComponentText).toContain("value of statistical life");
    expect(vslModalComponentText).toContain(`United Kingdom: ${expectedUKAverageVslText}`);
    expect(vslModalComponentText).toContain("United States: 123,456,789 Int'l$");
  });
});
