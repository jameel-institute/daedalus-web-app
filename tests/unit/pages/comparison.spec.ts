import Comparison from "@/pages/comparison.vue";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockPinia, mockResultData, mockVersions } from "../mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";
import { waitFor } from "@testing-library/vue";

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
  });

  it("should load and list scenarios as expected", async () => {
    const component = await mountSuspended(Comparison, { global: { plugins: [pinia] } });
    const appStore = useAppStore(pinia);
    const appStoreStatusSpy = vi.spyOn(appStore, "refreshScenarioStatus");

    await waitFor(() => {
      expect(appStore.currentComparison.scenarios.length).toBe(3);

      const text = component.text();

      expect(text).toContain("Comparison");

      // Parameters
      expect(text).toMatch(/pathogen\s+\(Axis\)/i);
      expect(text).toMatch(/sars_cov_1\s+\(Baseline\)/i);
      expect(text).toContain("sars_cov_2_pre_alpha");
      expect(text).toContain("sars_cov_2_omicron");
      expect(text.match(/elimination/g)).toHaveLength(3);
      expect(text.match(/USA/g)).toHaveLength(3);
      expect(text.match(/medium/g)).toHaveLength(3);
      expect(text.match(/305000/g)).toHaveLength(3);
      // Run ids
      expect(text).toContain("sars2004RunId".slice(0, 8));
      expect(text).toContain("covidWildTypeRunId".slice(0, 8));
      expect(text).toContain("covidOmicronRunId".slice(0, 8));
      // Results
      expect(text).toContain("$1.0 billion");
      expect(text).toContain("$2.0 billion");
      expect(text).toContain("$3.0 billion");

      // Don't continue polling for status after runs are known to be complete
      expect(appStoreStatusSpy).toHaveBeenCalledTimes(3);
    });
  });

  it("resets appStore.downloadError when the page is loaded", async () => {
    const piniaMock = mockPinia({
      metadata: mockMetadataResponseData as Metadata,
      versions: mockVersions,
      downloadError: "Some error",
    }, false, { stubActions: false });

    await mountSuspended(Comparison, { global: { plugins: [piniaMock] } });

    const appStore = useAppStore();
    expect(appStore.downloadError).toBeUndefined();
  });
});
