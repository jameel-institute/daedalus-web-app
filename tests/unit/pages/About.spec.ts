import About from "@/pages/about.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockedMetadata, mockPinia } from "../mocks/mockPinia";

describe("about page", () => {
  it("should render about with correct metadata info", async () => {
    const numberOfPandemics = mockedMetadata?.parameters.find(p => p.id === "pathogen")!.options!.length;
    const numberOfCountries = mockedMetadata?.parameters.find(p => p.id === "country")!.options!.length;
    const component = await mountSuspended(About, { global: { plugins: [mockPinia()] } });

    const text = component.text();

    expect(text).toContain("About");
    expect(text).toContain(numberOfPandemics);
    expect(text).toContain(numberOfCountries);
    for (const estimate of mockedMetadata.results.time_series_groups) {
      expect(text).toContain(estimate.label);
    }
  });
});
