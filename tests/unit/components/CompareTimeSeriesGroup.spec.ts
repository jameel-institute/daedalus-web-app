import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { DisplayInfo } from "~/types/apiResponseTypes";
import { mockedMetadata, mockPinia } from "../mocks/mockPinia";
import { CompareTimeSeriesGroup } from "#components";

const pinia = mockPinia();
const getProps = (isDaily: boolean) => ({
  groupIndex: 0,
  hideTooltips: false,
  isDaily,
  seriesGroup: mockedMetadata.results.time_series_groups.find(g => g.id === "hospitalisations") as TimeSeriesGroup,
  synchPoint: { x: 1, y: 2 } as Highcharts.Point,
});

describe("timeSeriesGroup component", () => {
  it("should render correct header and time series with correct props, and the show capacities switch when relevant", async () => {
    const component = await mountSuspended(CompareTimeSeriesGroup, {
      global: { plugins: [pinia], stubs: ["CompareTimeSeries.client"] },
      props: getProps(false),
    });

    const text = component.text();

    expect(text).toContain("Show hospital surge capacity");
    expect(text).toContain("Hospital demand");
    expect(text).toContain("Infections requiring hospitalisation");
    const stubbedTimeSeriesComponent = component.findComponent({ name: "CompareTimeSeries.client" });
    expect(stubbedTimeSeriesComponent.props("groupIndex")).toBe(0);
    expect(stubbedTimeSeriesComponent.props("hideTooltips")).toBe(false);
    expect(stubbedTimeSeriesComponent.props("showCapacities")).toBe(false);
    expect(stubbedTimeSeriesComponent.props("synchPoint")).toEqual({ x: 1, y: 2 });
    const expectedTimeSeries = mockedMetadata.results.time_series.find(t => t.id === "hospitalised") as DisplayInfo;
    expect(stubbedTimeSeriesComponent.props("timeSeriesMetadata")).toEqual(expectedTimeSeries);

    const showCapacitiesSwitch = component.getComponent({ name: "CFormSwitch" });
    await showCapacitiesSwitch.setValue(true);

    expect(stubbedTimeSeriesComponent.props("showCapacities")).toBe(true);

    component.setProps({ isDaily: true });
    await nextTick();
    expect(stubbedTimeSeriesComponent.props("showCapacities")).toBe(false);
  });

  it("should render correct header and time series, but not the show capacities switch when not relevant", async () => {
    const component = await mountSuspended(CompareTimeSeriesGroup, {
      global: { plugins: [pinia], stubs: ["CompareTimeSeries.client"] },

      props: getProps(true),
    });

    const text = component.text();

    expect(text).not.toContain("Show hospital surge capacity");
    expect(text).toContain("New hospitalisations");
    expect(text).toContain("Number of new patients in need of hospitalisation per day");
    const stubbedTimeSeriesComponent = component.findComponent({ name: "CompareTimeSeries.client" });
    expect(stubbedTimeSeriesComponent.props("groupIndex")).toBe(0);
    expect(stubbedTimeSeriesComponent.props("hideTooltips")).toBe(false);
    expect(stubbedTimeSeriesComponent.props("showCapacities")).toBe(false);
    expect(stubbedTimeSeriesComponent.props("synchPoint")).toEqual({ x: 1, y: 2 });
    const expectedTimeSeries = mockedMetadata.results.time_series.find(t => t.id === "new_hospitalised") as DisplayInfo;
    expect(stubbedTimeSeriesComponent.props("timeSeriesMetadata")).toEqual(expectedTimeSeries);
  });
});
