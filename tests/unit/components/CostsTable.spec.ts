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
  "$8.925 T",
  "$6.531 T",
  "$6.329 T",
  "$201.8 B",
  "$1.539 T",
  "$1.536 T",
  "$3.146 B",
  "$855.2 B",
  "$300 M",
  "$648.9 B",
  "$30.64 B",
  "$175.4 B",
];
const expectedLifeYearsNaturalUnitsCostsForNoneScenario = ["158.1 M", "9.945 M", "85.88 M", "38.42 M", "23.85 M"];
const expectedDeathsForNoneScenario = "378 K";

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

const checkPercentText = (costUSD: number, gdp: number, componentText: string) => {
  const percent = costAsPercentOfGdp(costUSD, gdp);
  if (percent < 1) {
    expect(componentText).toContain("<1%");
  } else {
    expect(componentText).toContain(percent.toFixed(1));
  }
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

    expect(headerText).toContain("Expand all");
    expect(headerText).not.toContain("Collapse all");

    expect(component.find("tbody tr").text()).toContain("Total losses (USD)");

    const rows = component.findAll("tbody tr");
    expectedCostsForNoneScenario.forEach((cost, index) => expect(rows[index].text()).toContain(cost));

    const lifeYearsNaturalUnitsRow = component.findAll("tbody tr")[expectedCostsForNoneScenario.length + 1].text();
    expect(lifeYearsNaturalUnitsRow).toContain("Life years lost");
    expectedLifeYearsNaturalUnitsCostsForNoneScenario.forEach((cost, index) => {
      const row = component.findAll("tbody tr")[index + expectedCostsForNoneScenario.length + 1];
      expect(row.text()).toContain(cost);
    });

    const deathRow = component.findAll("tbody tr")[
      expectedCostsForNoneScenario.length + expectedLifeYearsNaturalUnitsCostsForNoneScenario.length + 2
    ].text();
    expect(deathRow).toContain("Deaths");
    expect(deathRow).toContain(expectedDeathsForNoneScenario);
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

    expect(component.find("tbody tr").text()).toContain("Total losses as % of GDP");

    const componentText = component.text();
    mockResultResponseData.costs[0].children.forEach((cost) => {
      const costUSD = cost.values.find(v => v.metric === USD_METRIC)!.value;
      checkPercentText(costUSD, mockResultResponseData.gdp, componentText);
      cost.children.forEach((subCost) => {
        const subCostUSD = subCost.values.find(v => v.metric === USD_METRIC)!.value;
        checkPercentText(subCostUSD, mockResultResponseData.gdp, componentText);
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
    "$17.85 T",
    "$13.06 T",
    "$12.66 T",
    "$403.5 B",
    "$3.077 T",
    "$3.071 T",
    "$6.292 B",
    "$1.710 T",
    "$700 M",
    "$1.298 T",
    "$61.27 B",
    "$350.8 B",
  ];
  const expectedDeathsForMediumScenario = "12.3 K";
  const expectedLifeYearsNaturalUnitsCostsForMediumScenario = [
    "316.2 M",
    "19.89 M",
    "171.8 M",
    "76.85 M",
    "47.7 M",
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

    expect(component.find("tbody tr").text()).toContain("Total losses (USD)");

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
    const lifeYearsNaturalUnitsRow = rows[expectedCostsForNoneScenario.length + 1].text();
    expect(lifeYearsNaturalUnitsRow).toContain("Life years lost");
    expectedLifeYearsNaturalUnitsCostsForNoneScenario.forEach((cost, index) => {
      const rowText = rows[index + expectedCostsForNoneScenario.length + 1].text();
      expect(rowText).toContain(cost);
      expect(rowText).toContain(expectedLifeYearsNaturalUnitsCostsForMediumScenario[index]);
    });

    const deathRow = rows[
      expectedCostsForNoneScenario.length + expectedLifeYearsNaturalUnitsCostsForNoneScenario.length + 2
    ].text();
    expect(deathRow).toContain("Deaths");
    expect(deathRow).toContain(expectedDeathsForNoneScenario);
    expect(deathRow).toContain(expectedDeathsForMediumScenario);

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
    // Scenario labels
    expect(headerText).toContain("None");
    expect(headerText).toContain("Medium");

    const componentText = component.text();
    expect(component.find("tbody tr").text()).toContain("Total losses as % of GDP");
    mockResultResponseData.costs.forEach((totalCost) => {
      const totalCostUSD = totalCost.values.find(v => v.metric === USD_METRIC)!.value;
      checkPercentText(totalCostUSD, mockResultResponseData.gdp, componentText);
      checkPercentText(totalCostUSD * differenceBetweenScenarios, mockResultResponseData.gdp, componentText);
      totalCost.children.forEach((cost) => {
        const costUSD = cost.values.find(v => v.metric === USD_METRIC)!.value;
        checkPercentText(costUSD, mockResultResponseData.gdp, componentText);
        checkPercentText(costUSD * differenceBetweenScenarios, mockResultResponseData.gdp, componentText);
        cost.children.forEach((subCost) => {
          const subCostUSD = subCost.values.find(v => v.metric === USD_METRIC)!.value;
          checkPercentText(subCostUSD, mockResultResponseData.gdp, componentText);
          checkPercentText(subCostUSD * differenceBetweenScenarios, mockResultResponseData.gdp, componentText);
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
    // Scenario labels
    expect(headerText).toContain("None");
    expect(headerText).not.toContain("Medium");

    const componentText = component.text();
    expect(component.find("tbody tr").text()).toContain("Net losses relative to baseline (USD)");
    let numberOfNegativeDifferences = 0;
    Array.from(componentText.matchAll(/-\$?\d/g)).forEach(() => {
      numberOfNegativeDifferences++;
    });
    expect(numberOfNegativeDifferences).toEqual(expectedCostsForNoneScenario.length + expectedLifeYearsNaturalUnitsCostsForNoneScenario.length);

    const rows = component.findAll("tbody tr");
    expect(rows[expectedCostsForNoneScenario.length + 1].text()).toContain("Life years lost relative to baseline");
    const deathRow = rows[expectedCostsForNoneScenario.length + expectedLifeYearsNaturalUnitsCostsForNoneScenario.length + 2];
    expect(deathRow.text()).toContain("Deaths relative to baseline");
    expect(deathRow.text()).toContain("+366 K"); // A positive difference including '+' sign

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
