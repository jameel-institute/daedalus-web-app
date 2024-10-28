import About from "@/pages/about.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { countryAndPathogenParams, mockedMetadata, mockPinia } from "../mocks/mockPinia";

describe("about page", () => {
  it("should render about with correct metadata info", async () => {
    const numberOfPandemics = countryAndPathogenParams.find(p => p.id === "pathogen")!.options!.length;
    const numberOfCountries = countryAndPathogenParams.find(p => p.id === "country")!.options!.length;
    const component = await mountSuspended(About, { global: { plugins: [mockPinia({
      metadata: { ...mockedMetadata, parameters: countryAndPathogenParams as any },
    })] } });

    const text = component.text();

    expect(text).toContain("About");
    expect(text).toContain(numberOfPandemics);
    expect(text).toContain(numberOfCountries);
    for (const estimate of mockedMetadata.results.time_series_groups) {
      expect(text).toContain(estimate.label);
    }
  });
});
