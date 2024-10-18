import ScenariosIdPage from "@/pages/scenarios/[runId].vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";

import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mockMetadataResponseData } from "~/tests/unit/mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";

const stubs = {
  CIcon: true,
  TimeSeries: true,
};

const longRunningRunId = "123";
const failedRunId = "456";
const successfulRunId = "789";
const piniaBaseData = {
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
};
const piniaDataForLongRunningRun = {
  ...piniaBaseData,
  currentScenario: {
    ...piniaBaseData.currentScenario,
    runId: longRunningRunId,
  },
};
const piniaDataForFailedRun = {
  ...piniaBaseData,
  currentScenario: {
    ...piniaBaseData.currentScenario,
    runId: failedRunId,
  },
};
const piniaDataForSuccessfulRun = {
  ...piniaBaseData,
  currentScenario: {
    ...piniaBaseData.currentScenario,
    runId: successfulRunId,
  },
};
const mockPiniaWithLongRunningAnalysis = mockPinia(piniaDataForLongRunningRun, false, { stubActions: false });
const mockPiniaWithFailingAnalysis = mockPinia(piniaDataForFailedRun, false, { stubActions: false });
const mockPiniaWithSuccessfulAnalysis = mockPinia(piniaDataForSuccessfulRun, false, { stubActions: false });

registerEndpoint(`/api/scenarios/${longRunningRunId}/status`, () => {
  return {
    runStatus: "running",
    runSuccess: null,
    done: false,
    runErrors: null,
    runId: longRunningRunId,
  };
});

registerEndpoint(`/api/scenarios/${failedRunId}/status`, () => {
  return {
    runStatus: "failed",
    runSuccess: false,
    done: true,
    runErrors: ["No biscuits available. Analysis lost motivation."],
    runId: failedRunId,
  };
});

registerEndpoint(`/api/scenarios/${successfulRunId}/status`, () => {
  return {
    runStatus: "complete",
    runSuccess: true,
    done: true,
    runErrors: null,
    runId: successfulRunId,
  };
});

registerEndpoint(`/api/scenarios/${successfulRunId}/result`, () => {
  return mockResultData;
});

beforeAll(async () => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("scenario result page", () => {
  it("shows the parameters that were used to run the scenario", async () => {
    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins: [mockPiniaWithLongRunningAnalysis] } });

    expect(component.text()).toContain("Parameters");
    expect(component.text()).toContain("United Kingdom");
    expect(component.text()).toContain("SARS 2004");
    expect(component.text()).toContain("No closures");
    expect(component.text()).toContain("None");
    expect(component.text()).toContain("30,500");
  });

  // Also end-to-end tested in tests/e2e/slowAnalysis.spec.ts
  it("shows alerts when analysis is taking a long time and when it is taking a really long time", async () => {
    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins: [mockPiniaWithLongRunningAnalysis] } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(true);
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(spinner.isVisible()).toBe(true);

    vi.advanceTimersByTime(11000);
    await nextTick();
    // This alert text should be displayed after a further 10 seconds of waiting.
    expect(component.text()).toContain("Analysis status: running");
    expect(component.text()).toContain("Thank you for waiting.");
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(spinner.isVisible()).toBe(true);
  });

  it("shows alerts when analysis fails", async () => {
    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins: [mockPiniaWithFailingAnalysis] } });

    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(false);
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).toContain("No biscuits available.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);

    vi.advanceTimersByTime(11000);
    await nextTick();
    expect(component.text()).toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);
  });

  it("shows no alerts when analysis succeeds", async () => {
    const component = await mountSuspended(ScenariosIdPage, { global: { stubs, plugins: [mockPiniaWithSuccessfulAnalysis] } });

    const spinner = component.findComponent({ name: "CSpinner" });
    // Two nextTicks are needed to wait for the spinner to disappear: status fetch and result fetch.
    await waitFor(() => {
      expect(spinner.isVisible()).toBe(false);
    });
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");

    vi.advanceTimersByTime(6000);
    await nextTick();
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);

    vi.advanceTimersByTime(11000);
    await nextTick();
    expect(component.text()).not.toContain("The analysis run failed.");
    expect(component.text()).not.toContain("Analysis status: running");
    expect(component.text()).not.toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(false);
  });
});
