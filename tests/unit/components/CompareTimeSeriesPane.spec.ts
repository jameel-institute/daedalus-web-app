import { CapacitiesAndInterventionsLegend, CompareTimeSeriesPane } from "#components";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockPinia } from "../mocks/mockPinia";

describe("time series comparison pane", () => {
  it("should only render the plot lines in the capacities and interventions legend when not in daily mode", async () => {
    const component = await mountSuspended(CompareTimeSeriesPane, {
      global: {
        stubs: ["CapacitiesAndInterventionsLegend", "CompareTimeSeriesLegend", "CompareTimeSeries.client"],
        plugins: [mockPinia()],
      },
      props: {
        isDaily: false,
      },
    });

    expect(component.findComponent(CapacitiesAndInterventionsLegend).props("showPlotLines")).toBe(true);

    const dailySwitch = component.getComponent({ name: "CFormSwitch" });
    await dailySwitch.setValue(true);

    expect(component.findComponent(CapacitiesAndInterventionsLegend).props("showPlotLines")).toBe(false);
  });
});
