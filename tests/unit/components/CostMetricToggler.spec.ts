import CostMetricToggler from "~/components/CostMetricToggler.vue";
import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { setActivePinia } from "pinia";

describe("cost metric toggler", () => {
  it("should render the switch with the label 'Show life years lost only'", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    expect(component.find("label").text()).toBe("Show life years lost only");
  });

  it("should render the switch unchecked when the cost metric is USD", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = USD_METRIC;

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    const switchInput = component.find<HTMLInputElement>("#costMetricSwitch");
    expect(switchInput.element.checked).toBe(false);
  });

  it("should render the switch checked when the cost metric is life years", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = LIFE_YEARS_METRIC;

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    const switchInput = component.find<HTMLInputElement>("#costMetricSwitch");
    expect(switchInput.element.checked).toBe(true);
  });

  it("should update the store to life years metric when the switch is toggled on", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = USD_METRIC;

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    await component.find("#costMetricSwitch").setValue(true);

    expect(appStore.preferences.costMetric).toBe(LIFE_YEARS_METRIC);
  });

  it("should update the store to USD metric when the switch is toggled off", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);
    const appStore = useAppStore(pinia);
    appStore.preferences.costMetric = LIFE_YEARS_METRIC;

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    await component.find("#costMetricSwitch").setValue(false);

    expect(appStore.preferences.costMetric).toBe(USD_METRIC);
  });
});
