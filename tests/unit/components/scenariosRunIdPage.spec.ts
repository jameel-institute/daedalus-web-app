import ScenariosIdPage from "@/pages/scenarios/[runId].vue";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";

import { describe, expect, it, vi } from "vitest";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { emptyScenario, mockPinia, mockResultData } from "../mocks/mockPinia";

const stubs = {
  CIcon: true,
};

const plugins = [mockPinia({
  currentScenario: {
    ...emptyScenario,
    runId: "123",
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
}, false, {
  stubActions: false,
})];

registerEndpoint("/api/scenarios/123/status", () => {
  return {
    runStatus: "running",
    runSuccess: null,
    done: false,
    runErrors: null,
    runId: "123",
  };
});

describe("scenario result page", () => {
  it("shows the parameters that were used to run the scenario", async () => {
    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    expect(component.text()).toContain("Parameters");
    expect(component.text()).toContain("United Kingdom");
    expect(component.text()).toContain("SARS 2004");
    expect(component.text()).toContain("No closures");
    expect(component.text()).toContain("None");
    expect(component.text()).toContain("30,500");
  });

  // Also end-to-end tested in tests/e2e/slowAnalysis.spec.ts
  it("shows alerts when analysis is taking a long time and when it is taking a really long time", async () => {
    vi.useFakeTimers();

    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(true);
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("The analysis is taking longer than expected.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).not.toContain("The analysis is taking longer than expected.");
    expect(spinner.isVisible()).toBe(true);

    vi.advanceTimersByTime(11000);
    await nextTick();
    // This alert text should be displayed after a further 10 seconds of waiting.
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).toContain("The analysis is taking longer than expected.");
    expect(spinner.isVisible()).toBe(true);

    vi.useRealTimers();
  });
});
