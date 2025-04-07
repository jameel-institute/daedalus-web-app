import Comparison from "@/pages/comparison.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockPinia, mockVersions } from "../mocks/mockPinia";
import { mockMetadataResponseData } from "../mocks/mockResponseData";
import type { Metadata } from "~/types/apiResponseTypes";

const pinia = mockPinia({
  metadata: mockMetadataResponseData as Metadata,
  versions: mockVersions,
}, false, { stubActions: false });

describe("comparison page", () => {
  it("should list scenarios as expected when there are at least two selected scenarios", async () => {
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
});
