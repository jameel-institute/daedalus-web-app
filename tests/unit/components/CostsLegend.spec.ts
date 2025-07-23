import CostsLegend from "@/components/CostsLegend.client.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";

describe("chart legend", () => {
  it("renders legend items correctly", async () => {
    const component = await mountSuspended(CostsLegend, {
      global: {
        plugins: [mockPinia(
          {
            currentComparison: {
              axis: "country",
              baseline: "USA",
              scenarios: [{
                ...emptyScenario,
                parameters: {
                  country: "USA",
                },
                result: {
                  data: mockResultResponseData as ScenarioResultData,
                  fetchError: undefined,
                  fetchStatus: "success",
                },
              }],
            },
            metadata: mockMetadataResponseData,
          },
          false,
          { stubActions: false },
        )],
      },
    });

    // Items are presented in the same order that they appear in results data
    expect(component.text()).toMatch(/GDP.*Education.*Life\s+years/);
  });
});
