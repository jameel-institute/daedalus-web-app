import { CompareTimeSeriesLegend } from "#components";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockMetadataResponseData } from "../mocks/mockResponseData";

describe("time series", () => {
  it("should render the correct labels for the scenarios", async () => {
    const economicClosuresScenario = {
      ...emptyScenario,
      runId: "test-run-id",
      parameters: {
        response: "economic_closures",
      },
    };
    const noneScenario = {
      ...emptyScenario,
      runId: "test-run-id-2",
      parameters: {
        response: "none",
      },
    };
    const pinia = mockPinia({
      currentComparison: {
        baseline: "economic_closures",
        axis: "response",
        scenarios: [noneScenario, economicClosuresScenario],
      },
      metadata: mockMetadataResponseData,
    }, false, { stubActions: false });

    const component = await mountSuspended(CompareTimeSeriesLegend, { global: { plugins: [pinia] } });

    expect(component.text()).toContain("Scenarios by response");

    const lineItems = component.findAll(".legend-item-line");

    expect(lineItems[0].text()).toContain("No closures");
    expect(lineItems[0].text()).not.toContain("baseline");
    expect(lineItems[0].element.outerHTML).toContain("background: rgb(238, 51, 119)");

    expect(lineItems[1].text()).toMatch(/Business closures\s+\(baseline\)/);
    expect(lineItems[1].element.outerHTML).toContain("background: rgb(238, 119, 51)");
  });
});
