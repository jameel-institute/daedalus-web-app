import ParameterInfoCard from "@/components/ParameterInfoCard.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

const stubs = {
  CIcon: true,
};

const plugins = [mockPinia({
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
}, false, { stubActions: false })];

describe("parameter info card", () => {
  it("shows the parameters that were used to run the scenario", () => {
    const component = mount(ParameterInfoCard, { global: { stubs, plugins } });

    expect(component.text()).toContain("Parameters");
    expect(component.text()).toContain("United Kingdom");
    expect(component.text()).toContain("SARS 2004");
    expect(component.text()).toContain("No closures");
    expect(component.text()).toContain("None");
    expect(component.text()).toContain("30,500");
  });
});
