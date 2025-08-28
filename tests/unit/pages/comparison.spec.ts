import Comparison from "@/pages/comparison.vue";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockPinia, mockResultData, mockVersions } from "../mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { waitFor } from "@testing-library/vue";
import { setActivePinia } from "pinia";

const stubs = {
  "CIcon": true,
  "CompareCostsChart.client": true,
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
        value: (index + 1) * 1000,
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

afterEach(() => {
  mockRoute.mockReset();
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

    await waitFor(() => {
      expect(appStore.currentComparison.scenarios.length).toBe(3);

      const text = component.text();

      expect(text).toContain("Explore by disease");

      // Don't continue polling for status after runs are known to be complete
      expect(appStoreStatusSpy).toHaveBeenCalledTimes(3);
    });
  });

  it("should initialise with the losses tab selected", async () => {
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    await waitFor(() => {
      const tabPanes = component.findAll(".tab-pane");
      expect(tabPanes[0].text()).toContain("Show losses");
      expect(tabPanes[1].text()).toContain("A time series");
      expect(tabPanes[0].isVisible()).toBe(true);
      expect(tabPanes[1].isVisible()).toBe(false);
    });
  });

  it("should render the baseline scenario's parameters in a parameter info card", async () => {
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia], stubs } });

    const infoCard = component.find(".card");

    await waitFor(() => {
      const text = infoCard.text();
      expect(text).toContain("Baseline scenario");
      expect(text).toContain("United States");
      expect(text).toContain("SARS 2004");
      expect(text).toContain("Elimination");
      expect(text).toContain("Medium");
      expect(text).toContain("305,000");
    });
  });

  it("resets appStore.downloadError when the page is loaded", async () => {
    const piniaMock = mockPinia({
      metadata: mockMetadataResponseData as Metadata,
      versions: mockVersions,
      downloadError: "Some error",
    }, false, { stubActions: false });

    await mountSuspended(Comparison, { global: { plugins: [piniaMock], stubs } });

    const appStore = useAppStore();
    expect(appStore.downloadError).toBeUndefined();
  });
});
