import { mountSuspended } from "@nuxt/test-utils/runtime";
import ParameterSelect from "~/components/ParameterForm/ParameterSelect.vue";
import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import { TypeOfParameter } from "~/types/parameterTypes";

const stubs = { CIcon: true };
const plugins = [mockPinia({}, true, { stubActions: false })];

const pathogenParameter = {
  id: "pathogen",
  label: "Pathogen",
  parameterType: TypeOfParameter.Select,
  defaultOption: "influenza_wild",
  ordered: false,
  options: [
    { id: "influenza_wild", label: "Influenza (wild type)" },
    { id: "influenza_vaccine", label: "Influenza (vaccine-targeted)" },
    { id: "sars_cov_1", label: "SARS-CoV-1" },
    { id: "sars_cov_2", label: "SARS-CoV-2" },
  ],
};

const responseParameter = {
  id: "response",
  label: "Response",
  parameterType: TypeOfParameter.Select,
  defaultOption: "none",
  ordered: false,
  options: [
    { id: "none", label: "None", description: "No intervention" },
    { id: "elimination", label: "Elimination" },
  ],
};

describe("parameter select component", () => {
  describe("pathogen tag in selected value display", () => {
    it("shows the influenza tag when the selected pathogen option contains 'influenza'", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: pathogenParameter, pulsing: false, parameterValue: "influenza_wild" },
        global: { stubs, plugins },
      });

      const tag = component.find(".single-value .pathogenTag");
      expect(tag.classes()).toContain("influenza");
      expect(tag.text()).toBe("influenza");
    });

    it("shows the SARS-CoV tag when the selected pathogen option does not contain 'influenza'", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: pathogenParameter, pulsing: false, parameterValue: "sars_cov_2" },
        global: { stubs, plugins },
      });

      const tag = component.find(".single-value .pathogenTag");
      expect(tag.classes()).toContain("SARS-CoV");
      expect(tag.text()).toBe("SARS-CoV");
    });

    it("shows no tag text for non-pathogen parameters", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: responseParameter, pulsing: false, parameterValue: "none" },
        global: { stubs, plugins },
      });

      expect(component.find(".single-value .pathogenTag").exists()).toBe(false);
    });
  });

  describe("pathogen tags in dropdown options", () => {
    it("tags each option with influenza or SARS-CoV based on the option value", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: pathogenParameter, pulsing: false, parameterValue: "influenza_wild" },
        global: { stubs, plugins },
      });

      await component.find(".dropdown-icon").trigger("click");
      const options = component.findAll(".menu .parameter-option");

      const influenzaOptions = options.filter(o => o.text().includes("Influenza"));
      const sarsOptions = options.filter(o => o.text().includes("SARS-CoV"));

      expect(influenzaOptions.length).toBe(2);
      influenzaOptions.forEach((option) => {
        expect(option.find(".pathogenTag").classes()).toContain("influenza");
        expect(option.find(".pathogenTag").text()).toBe("influenza");
      });

      expect(sarsOptions.length).toBe(2);
      sarsOptions.forEach((option) => {
        expect(option.find(".pathogenTag").classes()).toContain("SARS-CoV");
        expect(option.find(".pathogenTag").text()).toBe("SARS-CoV");
      });
    });

    it("shows no tag text on dropdown options for non-pathogen parameters", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: responseParameter, pulsing: false, parameterValue: "none" },
        global: { stubs, plugins },
      });

      await component.find(".dropdown-icon").trigger("click");
      const options = component.findAll(".menu .parameter-option");
      options.forEach((option) => {
        expect(option.find(".pathogenTag").exists()).toBe(false);
      });
    });
  });

  describe("option description", () => {
    it("renders the description in a p element", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: responseParameter, pulsing: false, parameterValue: "none" },
        global: { stubs, plugins },
      });

      await component.find(".dropdown-icon").trigger("click");
      const options = component.findAll(".menu .parameter-option");
      expect(options[0].find("p.text-xs").text()).toBe("No intervention");
    });

    it("does not render a description element when description is absent", async () => {
      const component = await mountSuspended(ParameterSelect, {
        props: { parameter: responseParameter, pulsing: false, parameterValue: "none" },
        global: { stubs, plugins },
      });

      await component.find(".dropdown-icon").trigger("click");
      const options = component.findAll(".menu .parameter-option");
      expect(options[1].find("p.text-xs").exists()).toBe(false);
    });
  });
});
