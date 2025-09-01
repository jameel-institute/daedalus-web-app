import CapacitiesAndInterventionsLegend from "~/components/CapacitiesAndInterventionsLegend.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const stubs = {
  CIcon: true,
};

const mediumScenario = {
  ...emptyScenario,
  runId: "test-run-id",
  parameters: {
    response: "medium",
  },
};
const noneScenario = {
  ...emptyScenario,
  runId: "test-run-id-2",
  parameters: {
    response: "none",
  },
};

describe("time series", () => {
  it("should render the correct labels for the plot lines and plot bands when dealing with a single scenario", async () => {
    const pinia = mockPinia({ currentScenario: mediumScenario });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [pinia] },
      props: { showPlotLines: true },
    });

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.text()).toContain("Pandemic response");
    expect(squareItem.element.outerHTML).toContain("background: rgba(51, 187, 238, 0.3)");

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");
    expect(lineItem.element.outerHTML).toContain("background: rgb(204, 51, 17)");
  });

  it("should not render the intervention plot bands if the current scenario does not involve interventions", async () => {
    const pinia = mockPinia({ currentScenario: noneScenario });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [pinia] },
      props: { showPlotLines: true },
    });

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.exists()).toBe(false);
  });

  it("should render the correct labels for the plot lines and plot bands when dealing with multiple scenarios", async () => {
    const pinia = mockPinia({
      currentComparison: {
        baseline: "medium",
        axis: "response",
        scenarios: [noneScenario, mediumScenario],
      },
    });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [pinia] },
      props: { showPlotLines: true },
    });

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.text()).toContain("Pandemic response");
    expect(squareItem.element.outerHTML).toContain("background: rgba(238, 119, 51, 0.3)");

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");
    expect(lineItem.element.outerHTML).toContain("background: rgb(204, 51, 17)");
  });

  it("should not render the plot lines label when props say not to", async () => {
    const pinia = mockPinia({
      currentComparison: {
        baseline: "medium",
        axis: "response",
        scenarios: [noneScenario, mediumScenario],
      },
    });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [pinia] },
      props: { showPlotLines: false },
    });

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.exists()).toBe(false);
  });
});
