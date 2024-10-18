import CostsTable from "@/components/CostsTable.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockedMetadata, mockPinia } from "../mocks/mockPinia";
import { mockResultResponseData } from "../mocks/mockResultResponseData";

describe("costsTable", () => {
  it("should render costs table correctly", async () => {
    const wrapper = await mountSuspended(CostsTable, {
      global: {
        plugins: [
          mockPinia(
            {
              currentScenario: {
                ...emptyScenario,
                result: {
                  data: mockResultResponseData as ScenarioResultData,
                  fetchError: undefined,
                  fetchStatus: "success",
                },
              },
            },
            true,
            false,
          ),
        ],
      },
    });

    const wrapperText = wrapper.text();

    mockedMetadata.results.costs.forEach((cost) => {
      expect(wrapperText).toContain(cost.label);
    });

    mockResultResponseData.costs[0].children.forEach((cost) => {
      expect(wrapperText).toContain(formatCurrency(cost.value));
      cost.children.forEach((subCost) => {
        expect(wrapperText).toContain(formatCurrency(subCost.value));
      });
    });
  });
});
