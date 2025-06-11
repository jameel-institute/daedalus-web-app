import Comparison from "@/pages/comparison.vue";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockPinia, mockVersions } from "../mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";

const enabledComparisonConfig = {
  public: {
    feature: {
      comparison: true,
    },
  },
};

const { mockRuntimeConfig } = vi.hoisted(() => ({
  mockRuntimeConfig: vi.fn(),
}));

mockNuxtImport("useRuntimeConfig", () => mockRuntimeConfig);

afterEach(() => {
  mockRuntimeConfig.mockReset();
});

const pinia = mockPinia({
  metadata: mockMetadataResponseData as Metadata,
  versions: mockVersions,
}, false, { stubActions: false });

describe("comparison page", () => {
  it("should list scenarios as expected when there are at least two selected scenarios", async () => {
    mockRuntimeConfig.mockReturnValue(enabledComparisonConfig);
    const component = await mountSuspended(Comparison, {
      global: { plugins: [pinia] },
      route: `/comparisons?`
        + `country=USA`
        + `&pathogen=sars_cov_1`
        + `&response=elimination`
        + `&vaccine=medium`
        + `&hospital_capacity=305000`
        + `&axis=pathogen`
        + `&scenarios=sars_cov_2_pre_alpha;sars_cov_2_omicron`,
    });

    const text = component.text();

    expect(text).toContain("Comparison");
    expect(text).toMatch(/pathogen\s+\(Axis\)/i);
    expect(text).toMatch(/sars_cov_1\s+\(Baseline\)/i);
    expect(text).toContain("sars_cov_2_pre_alpha");
    expect(text).toContain("sars_cov_2_omicron");
    expect(text.match(/elimination/g)).toHaveLength(3);
    expect(text.match(/USA/g)).toHaveLength(3);
    expect(text.match(/medium/g)).toHaveLength(3);
    expect(text.match(/305000/g)).toHaveLength(3);
  });

  it("should list scenarios as expected when there are is exactly one selected scenario", async () => {
    mockRuntimeConfig.mockReturnValue(enabledComparisonConfig);
    const component = await mountSuspended(Comparison, {
      global: { plugins: [pinia] },
      route: `/comparisons?`
        + `country=USA`
        + `&pathogen=sars_cov_1`
        + `&response=elimination`
        + `&vaccine=medium`
        + `&hospital_capacity=305000`
        + `&axis=pathogen`
        + `&scenarios=sars_cov_2_pre_alpha`,
    });

    const text = component.text();

    expect(text).toContain("Comparison");
    expect(text).toMatch(/pathogen\s+\(Axis\)/);
    expect(text).toContain("sars_cov_1  (Baseline)");
    expect(text).toContain("sars_cov_2_pre_alpha");
    expect(text.match(/elimination/g)).toHaveLength(2);
    expect(text.match(/USA/g)).toHaveLength(2);
    expect(text.match(/medium/g)).toHaveLength(2);
    expect(text.match(/305000/g)).toHaveLength(2);
  });

  it("resets appStore.downloadError when the page is loaded", async () => {
    mockRuntimeConfig.mockReturnValue(enabledComparisonConfig);
    await mountSuspended(Comparison, {
      global: {
        plugins: [mockPinia({
          metadata: mockMetadataResponseData as Metadata,
          versions: mockVersions,
          downloadError: "Some error",
        }, false, { stubActions: false })],
      },
      route: `/comparisons?`
        + `country=USA`
        + `&pathogen=sars_cov_1`
        + `&response=elimination`
        + `&vaccine=medium`
        + `&hospital_capacity=305000`
        + `&axis=pathogen`
        + `&scenarios=sars_cov_2_pre_alpha`,
    });

    const appStore = useAppStore();
    expect(appStore.downloadError).toBeUndefined();
  });

  it("does not render when the comparison feature is disabled", async () => {
    mockRuntimeConfig.mockReturnValue({
      public: {
        feature: {
          comparison: false,
        },
      },
    });

    const component = await mountSuspended(Comparison, {
      global: { plugins: [pinia] },
      route: `/comparisons?`
        + `country=USA`
        + `&pathogen=sars_cov_1`
        + `&response=elimination`
        + `&vaccine=medium`
        + `&hospital_capacity=305000`
        + `&axis=pathogen`
        + `&scenarios=sars_cov_2_pre_alpha`,
    });

    const text = component.text();
    expect(text).not.toContain("Comparison");
    expect(text).toContain("The comparison feature is not enabled");
  });
});
