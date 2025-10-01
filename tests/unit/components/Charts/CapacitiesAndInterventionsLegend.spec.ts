import CapacitiesAndInterventionsLegend from "~/components/Charts/CapacitiesAndInterventionsLegend.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";

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
      global: { plugins: [pinia] },
      props: { showPlotLines: true, comparisonMode: false },
    });

    const legendItems = component.findAll(".legend-item");
    const plotBandsLegendItem = legendItems[0];
    expect(plotBandsLegendItem.text()).toContain("Pandemic response");
    expect(plotBandsLegendItem.element.outerHTML).toContain("background: rgba(51, 187, 238, 0.3)");

    const plotLinesLegendItem = legendItems[1];
    expect(plotLinesLegendItem.text()).toContain("Hospital surge capacity");
    expect(plotLinesLegendItem.find("svg").element.outerHTML).toContain("rgb(204,51,17)");
  });

  it("should not render the intervention plot bands if the current scenario does not involve interventions", async () => {
    const pinia = mockPinia({ currentScenario: noneScenario });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { plugins: [pinia] },
      props: { showPlotLines: true, comparisonMode: false },
    });

    const plotLinesLegendItem = component.find(".legend-item");
    expect(plotLinesLegendItem.text()).toContain("Hospital surge capacity");

    expect(component.findAll(".legend-item")).toHaveLength(1);
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
      global: { plugins: [pinia] },
      props: { showPlotLines: true, comparisonMode: true },
    });

    const legendItems = component.findAll(".legend-item");
    const plotBandsLegendItem = legendItems[0];
    expect(plotBandsLegendItem.text()).toContain("Pandemic response");
    expect(plotBandsLegendItem.element.outerHTML).toContain("background: rgba(238, 119, 51, 0.3)");

    const plotLinesLegendItem = legendItems[1];
    expect(plotLinesLegendItem.text()).toContain("Hospital surge capacity");
    expect(plotLinesLegendItem.find("svg").element.outerHTML).toContain("rgb(204,51,17)");
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
      global: { plugins: [pinia] },
      props: { showPlotLines: false, comparisonMode: false },
    });

    const plotBandsLegendItem = component.find(".legend-item");
    expect(plotBandsLegendItem.text()).toContain("Pandemic response");

    expect(component.findAll(".legend-item")).toHaveLength(1);
  });
});
