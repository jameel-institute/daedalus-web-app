import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import TimeSeriesLegend from "@/components/TimeSeriesLegend.vue";

const stubs = {
  CIcon: true,
};
const plugins = [mockPinia()];

describe("time series", () => {
  it("should render the correct label for the time series, and the chart container", async () => {
    const component = await mountSuspended(TimeSeriesLegend, { global: { stubs, plugins } });

    expect(component.text()).toContain("Hospital capacity");
  });
});
