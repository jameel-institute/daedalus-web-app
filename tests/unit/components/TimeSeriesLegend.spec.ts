import TimeSeriesLegend from "@/components/TimeSeriesLegend.client.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { ScenarioResultData } from "~/types/apiResponseTypes";
import { mockResultResponseData } from "../mocks/mockResponseData";

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

describe("time series", () => {
  it("should render the correct label for the time series, and the chart container", async () => {
    const component = await mountSuspended(TimeSeriesLegend, { global: { stubs, plugins } });

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.text()).toContain("Pandemic response");

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");
  });
});
