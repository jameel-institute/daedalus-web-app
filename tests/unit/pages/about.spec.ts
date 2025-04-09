import About from "@/pages/about.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { mockedMetadata, mockPinia, mockVersions } from "../mocks/mockPinia";
import { TypeOfParameter } from "~/types/parameterTypes";

const countryParam = {
  id: "country",
  label: "Country",
  parameterType: TypeOfParameter.GlobeSelect,
  defaultOption: "THA",
  ordered: false,
  options: [
    { id: "ARG", label: "Argentina" },
    { id: "BRA", label: "Brazil" },
    { id: "CHN", label: "China" },
    { id: "DEU", label: "Germany" },
    { id: "GBR", label: "United Kingdom" },
  ],
};

const pathogenParam = {
  id: "pathogen",
  label: "Disease",
  parameterType: TypeOfParameter.Select,
  ordered: false,
  options: [
    { id: "sars_cov_1", label: "SARS 2004" },
    { id: "sars_cov_2_pre_alpha", label: "Covid-19 wild-type" },
    { id: "sars_cov_2_omicron", label: "Covid-19 Omicron" },
    { id: "sars_cov_2_delta", label: "Covid-19 Delta" },
    { id: "influenza_2009", label: "Influenza 2009 (Swine flu)" },
    { id: "influenza_1957", label: "Influenza 1957" },
    { id: "influenza_1918", label: "Influenza 1918 (Spanish flu)" },
  ],
  description:
    "Select a disease to set model parameters for transmissibility, incubation period and severity based on known characteristics of that historical epidemic or epidemic wave",
};

describe("about page", () => {
  it("should render about with correct metadata info", async () => {
    const component = await mountSuspended(About, {
      global: {
        plugins: [mockPinia({
          metadata: { ...mockedMetadata, parameters: [countryParam, pathogenParam] as any },
          versions: mockVersions,
        })],
      },
    });

    const text = component.text();

    expect(text).toContain("About");
    expect(text).toContain(pathogenParam.options.length);
    expect(text).toContain(countryParam.options.length);
    for (const estimate of mockedMetadata.results.time_series_groups) {
      expect(text).toContain(estimate.label);
    }
    expect(text).toContain("Model version: 1.2.3");
    expect(text).toContain("R API version: 4.5.6");
    expect(text).toContain("Web app version: 7.8.9");
  });
});
