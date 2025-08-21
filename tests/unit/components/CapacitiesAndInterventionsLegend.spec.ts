import CapacitiesAndInterventionsLegend from "~/components/CapacitiesAndInterventionsLegend.vue";
import { emptyScenario, mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const stubs = {
  CIcon: true,
};

describe("time series", () => {
  it("should render the correct labels for the plot lines and plot bands", async () => {
    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [mockPinia()] },
      props: { showPlotLines: true },
    });

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.text()).toContain("Pandemic response");

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");
  });

  it("should not render the plot lines label when props say not to", async () => {
    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [mockPinia()] },
      props: { showPlotLines: false },
    });

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.exists()).toBe(false);
  });

  it("should not render the intervention plot bands if the current scenario does not involve interventions", async () => {
    const pinia = mockPinia({
      currentScenario: {
        ...emptyScenario,
        parameters: {
          response: "none",
        },
      },
    });

    const component = await mountSuspended(CapacitiesAndInterventionsLegend, {
      global: { stubs, plugins: [pinia] },
      props: { showPlotLines: true },
    });

    const lineItem = component.find(".legend-item-line");
    expect(lineItem.text()).toContain("Hospital surge capacity");

    const squareItem = component.find(".legend-item-rectangle");
    expect(squareItem.exists()).toBe(false);
  });
});
