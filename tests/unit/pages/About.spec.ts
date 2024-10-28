import About from "@/pages/about.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { countryAndPathogenParams, mockedMetadata, mockPinia, mockVersions } from "../mocks/mockPinia";

describe("about page", () => {
  it("should render about with correct metadata info", async () => {
    const numberOfPandemics = countryAndPathogenParams.find(p => p.id === "pathogen")!.options!.length;
    const numberOfCountries = countryAndPathogenParams.find(p => p.id === "country")!.options!.length;
    const component = await mountSuspended(About, { global: { plugins: [mockPinia({
      metadata: { ...mockedMetadata, parameters: countryAndPathogenParams as any },
      versions: mockVersions,
    })] } });

    const text = component.text();

    expect(text).toContain("About");
    expect(text).toContain(numberOfPandemics);
    expect(text).toContain(numberOfCountries);
    for (const estimate of mockedMetadata.results.time_series_groups) {
      expect(text).toContain(estimate.label);
    }
    expect(text).toContain("Model version: 1.2.3");
    expect(text).toContain("R API version: 4.5.6");
    expect(text).toContain("Web app version: 7.8.9");
  });
});
