import CostsLegend from "~/components/Charts/CostsLegend.client.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia } from "~/tests/unit/mocks/mockPinia";
import { mockResultResponseData } from "~/tests/unit/mocks/mockResponseData";

describe("chart legend", () => {
  it("renders legend items correctly", async () => {
    const component = await mountSuspended(CostsLegend, {
      global: {
        plugins: [mockPinia(
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
        )],
      },
    });

    // Items are sorted in descending value order
    expect(component.text()).toMatch(/GDP.*Education.*Life\s+years/);
  });
});
