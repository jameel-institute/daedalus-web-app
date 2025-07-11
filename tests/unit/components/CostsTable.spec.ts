import CostsTable from "@/components/CostsTable.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { mockResultResponseData } from "../mocks/mockResponseData";
import { CostBasis } from "~/types/unitTypes";
import { costAsPercentOfGdp } from "~/components/utils/formatters";

const stubs = {
  CIcon: true,
};

describe("costsTable", () => {
  it("should render costs table correctly, when cost basis is USD", async () => {
    const wrapper = await mountSuspended(CostsTable, {
      global: {
        stubs,
        plugins: [
          mockPinia({
            currentScenario: {
              ...emptyScenario,
              result: {
                data: mockResultResponseData as ScenarioResultData,
                fetchError: undefined,
                fetchStatus: "success",
              },
            },
            preferences: {
              costBasis: CostBasis.USD,
            },
          }, true, { stubActions: false }),
        ],
      },
    });

    let wrapperText = wrapper.text();

    expect(wrapperText).toContain("Expand all");
    expect(wrapperText).not.toContain("Collapse all");

    const expandButton = wrapper.find("button[aria-label='Expand costs table']");
    await expandButton.trigger("click");

    wrapperText = wrapper.text();

    expect(wrapperText).not.toContain("Expand all");
    expect(wrapperText).toContain("Collapse all");

    [
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
    ].forEach(cost => expect(wrapperText).toContain(cost));
  });
});

it("should render costs table correctly, when cost basis is percent of GDP", async () => {
  const wrapper = await mountSuspended(CostsTable, {
    global: {
      stubs,
      plugins: [
        mockPinia({
          currentScenario: {
            ...emptyScenario,
            result: {
              data: mockResultResponseData as ScenarioResultData,
              fetchError: undefined,
              fetchStatus: "success",
            },
          },
          preferences: {
            costBasis: CostBasis.PercentGDP,
          },
        }, true, { stubActions: false }),
      ],
    },
  });

  const wrapperText = wrapper.text();

  mockResultResponseData.costs[0].children.forEach((cost) => {
    expect(wrapperText).toContain(costAsPercentOfGdp(cost.value, mockResultResponseData.gdp).toFixed(1));
    cost.children.forEach((subCost) => {
      expect(wrapperText).toContain(costAsPercentOfGdp(subCost.value, mockResultResponseData.gdp).toFixed(1));
    });
  });
});
