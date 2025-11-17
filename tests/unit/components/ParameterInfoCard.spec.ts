import ParameterInfoCard from "@/components/ParameterInfoCard.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { setActivePinia } from "pinia";

const stubs = {
  CIcon: true,
};

const pinia = mockPinia({
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
}, false, { stubActions: false });

describe("parameter info card", () => {
  beforeEach(() => {
    setActivePinia(pinia);
  });

  it("shows the parameters that were used to run the scenario", async () => {
    const appStore = useAppStore();

    const component = await mountSuspended(ParameterInfoCard, {
      props: { scenario: appStore.currentScenario },
      slots: {
        header: "Slot content",
      },
      global: { stubs, plugins: [pinia] },
    });

    expect(component.text()).toContain("Slot content");
    expect(component.text()).toContain("United Kingdom");
    expect(component.find(".fi").classes()).toContain("fi-gb");
    expect(component.text()).toContain("SARS 2004");
    expect(component.text()).toContain("No closures");
    expect(component.text()).toContain("None");
    expect(component.text()).toContain("30,500");
  });
});
