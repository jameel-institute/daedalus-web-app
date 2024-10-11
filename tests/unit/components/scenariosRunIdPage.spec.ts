import ScenariosIdPage from "@/pages/scenarios/[runId].vue";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";

import { describe, expect, it, vi } from "vitest";
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
}, true, {
  stubActions: false,
})];

registerEndpoint("/api/versions", () => {
  return {
    daedalusModel: "1.2.3",
    daedalusApi: "4.5.6",
    daedalusWebApp: "7.8.9",
  };
});

registerEndpoint("/api/scenarios/123/status", () => {
  return {
    runStatus: "running",
    runSuccess: null,
    done: false,
    runErrors: null,
    runId: "123",
  };
});

// Skipping this test suite because I couldn't work out why createTestingPinia was failing to
// affect the contents of the store. At the least, we need the store to contain a runId in order
// for the component to poll for the scenario status.
// Since we do need to test the situation where a job takes a long time, I've tested this in
// tests/e2e/slowAnalysis.spec.ts instead.
describe("scenario result page", () => {
  it("show the parameters that were used to run the scenario", async () => {
  });

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
