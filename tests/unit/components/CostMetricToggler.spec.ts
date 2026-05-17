import CostMetricToggler from "~/components/CostMetricToggler.vue";
import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { setActivePinia } from "pinia";

describe("cost metric toggler", () => {
  it("should render the switch with the label 'Show loss of life in life years'", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    expect(component.find("label").text()).toBe("Show loss of life in life years");
  });

  it("should render the switch unchecked by default", async () => {
    const pinia = mockPinia({}, true, { stubActions: false });
    setActivePinia(pinia);

    const component = await mountSuspended(CostMetricToggler, {
      global: { plugins: [pinia] },
    });

    const switchInput = component.find<HTMLInputElement>("#costMetricSwitch");
    expect(switchInput.element.checked).toBe(false);
  });
});
