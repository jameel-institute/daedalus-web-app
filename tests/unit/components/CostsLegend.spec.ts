import CostsLegend from "@/components/CostsLegend.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia } from "../mocks/mockPinia";
import { mockResultResponseData } from "../mocks/mockResultResponseData";

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
    expect(component.text()).toMatch(/Life\s+years.*GDP.*Education/);
  });
});
