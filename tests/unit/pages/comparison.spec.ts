import Comparison from "@/pages/comparison.vue";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { emptyScenario, mockPinia, mockResultData, mockVersions } from "../mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { waitFor } from "@testing-library/vue";
import { setActivePinia } from "pinia";
import { flushPromises } from "@vue/test-utils";

const stubs = {
  "CIcon": true,
  "CompareCostsChart.client": true,
  "CompareTimeSeries.client": true,
};
const pinia = mockPinia({
  metadata: mockMetadataResponseData as Metadata,
  versions: mockVersions,
}, false, { stubActions: false });

const parametersInCommon = {
  country: "USA",
  response: "elimination",
  vaccine: "medium",
  hospital_capacity: "305000",
};

const scenarioRunIds = {
  sars_cov_1: "sars2004RunId",
  sars_cov_2_pre_alpha: "covidWildTypeRunId",
  sars_cov_2_omicron: "covidOmicronRunId",
};

Object.entries(scenarioRunIds).forEach(([pathogenValue, runId], index) => {
  registerEndpoint(`/api/scenarios/${runId}/details`, () => {
    return {
      parameters: {
        ...parametersInCommon,
        pathogen: pathogenValue,
      },
      runId,
    };
  });

  registerEndpoint(`/api/scenarios/${runId}/status`, () => {
    return {
      done: true,
      runId,
      runErrors: null,
      runStatus: "complete",
      runSuccess: true,
    };
  });

  registerEndpoint(`/api/scenarios/${runId}/result`, () => {
    return {
      ...mockResultData,
      costs: [{
        id: "total",
        values: [{ metric: "usd_millions", value: (index + 1) * 1000 }],
        children: [],
      }],
      runId,
      parameters: {
        ...parametersInCommon,
      },
    };
  });
});

// https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockRoute } = vi.hoisted(() => ({
  mockRoute: vi.fn(),
}));

mockNuxtImport("useRoute", () => mockRoute);

beforeAll(async () => {
  vi.useFakeTimers();
});

afterEach(() => {
  mockRoute.mockReset();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("comparison page", () => {
  beforeEach(() => {
    mockRoute.mockReturnValue({
      query: {
        axis: "pathogen",
        baseline: "sars_cov_1",
        runIds: Object.values(scenarioRunIds).join(";"),
      },
    });
    setActivePinia(pinia);
  });

  it("should load and list scenarios as expected", async () => {
    const appStore = useAppStore();
    const appStoreStatusSpy = vi.spyOn(appStore, "refreshScenarioStatus");
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    vi.advanceTimersByTime(200);
    await flushPromises();

    expect(appStore.currentComparison.scenarios.length).toBe(3);
    expect(component.text()).toContain("Explore by disease");
    // Don't continue polling for status after runs are known to be complete
    expect(appStoreStatusSpy).toHaveBeenCalledTimes(3);
  });

  it("should initialise with the losses tab selected", async () => {
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });
    vi.advanceTimersByTime(200);
    await waitFor(() => {
      const tabPanes = component.findAll(".tab-pane");
      expect(tabPanes[0].text()).toContain("Show losses");
      expect(tabPanes[1].text()).toContain("Show new events per day");
      expect(tabPanes[0].isVisible()).toBe(true);
      expect(tabPanes[1].isVisible()).toBe(false);
    });
  });

  it("should render the baseline scenario's parameters in a parameter info card", async () => {
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    const infoCard = component.find(".card");

    vi.advanceTimersByTime(200);
    await flushPromises();

    const text = infoCard.text();
    expect(text).toContain("Baseline scenario");
    expect(text).toContain("United States");
    expect(text).toContain("SARS 2004");
    expect(text).toContain("Elimination");
    expect(text).toContain("Medium");
    expect(text).toContain("305,000");
  });

  it("resets appStore.downloadError and any previous scenario runs when the page is loaded", async () => {
    const piniaMock = mockPinia({
      metadata: mockMetadataResponseData as Metadata,
      versions: mockVersions,
      downloadError: "Some error",
      currentScenario: {
        ...emptyScenario,
        parameters: mockResultData.parameters,
      },
    }, false, { stubActions: false });

    await mountSuspended(Comparison, { global: { plugins: [piniaMock], stubs } });

    const appStore = useAppStore();
    expect(appStore.downloadError).toBeUndefined();
    expect(appStore.currentScenario.parameters).toBeUndefined();
    await waitFor(() => expect(appStore.currentComparison.axis).not.toBeUndefined());
  });

  it("shows alert when any run is taking a long time", async () => {
    const longRunningRunId = scenarioRunIds.sars_cov_2_pre_alpha;
    registerEndpoint(`/api/scenarios/${longRunningRunId}/status`, () => {
      return {
        runStatus: "running",
        runSuccess: null,
        done: false,
        runErrors: null,
        runId: longRunningRunId,
      };
    });

    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    vi.advanceTimersByTime(200);
    await flushPromises();
    const spinner = component.findComponent({ name: "CSpinner" });
    expect(spinner.isVisible()).toBe(true);
    expect(component.text()).not.toContain("Thank you for waiting.");

    vi.advanceTimersByTime(6000);
    await flushPromises();
    expect(component.text()).toContain("Thank you for waiting.");
    expect(spinner.isVisible()).toBe(true);
  });

  it("shows alerts when any run fails (i.e. the API reports errors in the model run)", async () => {
    const failedRunId = scenarioRunIds.sars_cov_2_pre_alpha;
    registerEndpoint(`/api/scenarios/${failedRunId}/status`, () => {
      return {
        runStatus: "failed",
        runSuccess: false,
        done: true,
        runErrors: ["No oatcakes available. Scenario lost willpower."],
        runId: failedRunId,
      };
    });

    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    vi.advanceTimersByTime(200);
    await flushPromises();
    vi.advanceTimersByTime(200);
    await flushPromises();

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("No oatcakes available.");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows alert when any status request throws an error", async () => {
    registerEndpoint(`/api/scenarios/${scenarioRunIds.sars_cov_1}/status`, () => {
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });

    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);

    vi.advanceTimersByTime(200);
    await flushPromises();

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("418");
    expect(component.text()).toContain("I'm a teapot");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });

  it("shows alert when any result request throws an error", async () => {
    registerEndpoint(`/api/scenarios/${scenarioRunIds.sars_cov_2_omicron}/result`, () => {
      throw createError({
        statusCode: 418,
        statusMessage: "I'm a teapot",
      });
    });

    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);

    vi.advanceTimersByTime(200);
    await flushPromises();

    expect(component.text()).toContain("There was an unexpected error");
    expect(component.text()).toContain("418");
    expect(component.text()).toContain("I'm a teapot");
    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(false);
  });
});
