import CreateComparison from "@/components/CreateComparison.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { flushPromises } from "@vue/test-utils";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";

import type { Metadata, ScenarioResultData } from "~/types/apiResponseTypes";
import { describe, expect, it } from "vitest";
import { mockMetadataResponseData, mockResultResponseData } from "../mocks/mockResponseData";

const stubs = {
  CIcon: true,
  CIconSvg: true,
};

const testPinia = mockPinia({
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
    result: {
      data: mockResultResponseData as ScenarioResultData,
      fetchError: undefined,
      fetchStatus: "success",
    },
  },
  metadata: mockMetadataResponseData as Metadata,
}, false, { stubActions: false });

const plugins = [testPinia];
vi.mock("~/components/utils/comparisons", () => ({
  MAX_SCENARIOS_COMPARED_TO_BASELINE: 10,
  MIN_SCENARIOS_COMPARED_TO_BASELINE: 1,
}));

// Need to do this in hoisted - see https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));
mockNuxtImport("navigateTo", () => mockNavigateTo);

const getModalEl = (wrapper: VueWrapper) => {
  return wrapper.find("[aria-labelledby='chooseAxisModalTitle']");
};

const getComboboxEl = (wrapper: VueWrapper) => {
  return wrapper.find("[aria-labelledby='scenarioOptions']");
};

const openModal = async (wrapper: VueWrapper) => {
  await wrapper.find("button").trigger("click");
};

const getCountryButton = (axisOptionsEl: DOMWrapper<Element>) => {
  const countryButton = axisOptionsEl.findAll("button")[0];
  expect(countryButton.text()).toEqual("Country");
  return countryButton;
};

const getDiseaseButton = (axisOptionsEl: DOMWrapper<Element>) => {
  const diseaseButton = axisOptionsEl.findAll("button")[1];
  expect(diseaseButton.text()).toEqual("Disease");
  return diseaseButton;
};

const getVaccineButton = (axisOptionsEl: DOMWrapper<Element>) => {
  const vaccineButton = axisOptionsEl.findAll("button")[3];
  expect(vaccineButton.text()).toEqual("Global vaccine investment");
  return vaccineButton;
};

const getHospitalCapacityButton = (axisOptionsEl: DOMWrapper<Element>) => {
  const hospitalCapacityButton = axisOptionsEl.findAll("button")[4];
  expect(hospitalCapacityButton.text()).toEqual("Hospital surge capacity");
  return hospitalCapacityButton;
};

const errorResponseData = { error: "Test failed due to wrong parameters" };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe("create comparison button and modal", () => {
  it("does not render if current scenario has no results", async () => {
    const wrapper = await mountSuspended(CreateComparison, {
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: {
            ...emptyScenario,
            parameters: mockResultData.parameters,
          },
          metadata: mockMetadataResponseData as Metadata,
        }, false)],
      },
    });

    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("renders the choice of axis options as expected", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    expect(getModalEl(wrapper).exists()).toBe(false);

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    expect(modalEl.exists()).toBe(true);
    expect(modalEl.isVisible()).toBe(true);

    expect(modalEl.text()).toContain("Which parameter would you like to explore?");
    expect(modalEl.text()).not.toContain("Compare baseline scenario");

    const axisOptionsEl = modalEl.find("#axisOptions");
    const axisButtons = axisOptionsEl.findAll("button");
    expect(axisButtons[0].text()).toEqual("Country");
    expect(axisButtons[1].text()).toEqual("Disease");
    expect(axisButtons[2].text()).toEqual("Response");
    expect(axisButtons[3].text()).toEqual("Global vaccine investment");
    expect(axisButtons[4].text()).toEqual("Hospital surge capacity");

    axisButtons.forEach(button => expect(button.classes()).not.toContain("bg-primary"));
  });

  it("reveals the scenario select once an axis is chosen, and re-hides it when axis is de-selected", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });
    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = getCountryButton(axisOptionsEl);
    await countryButton.trigger("click");

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(countryButton.classes()).toContain("bg-primary");

    expect(modalEl.text()).toContain("Compare baseline scenario United Kingdom against:");
    expect(getComboboxEl(wrapper).isVisible()).toBe(true);

    // Click the already-selected parameter axis button to deselect it
    await countryButton.trigger("click");

    // Hides the scenario selection section and reveals all parameter axis buttons
    expect(modalEl.text()).not.toContain("Compare baseline scenario");
    expect(getComboboxEl(wrapper).exists()).toBe(false);
    expect(axisOptionsEl.findAll("button")).toHaveLength(5);
    axisOptionsEl.findAll("button").forEach((button) => {
      expect(button.classes()).not.toContain("bg-primary");
    });

    const diseaseButton = getDiseaseButton(axisOptionsEl);
    await diseaseButton.trigger("click");

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(diseaseButton.classes()).toContain("bg-primary");
    expect(modalEl.text()).toContain("Compare baseline scenario SARS 2004 against:");

    // Click the already-selected parameter axis button to deselect it
    await diseaseButton.trigger("click");

    const hospitalCapacityButton = getHospitalCapacityButton(axisOptionsEl);
    await hospitalCapacityButton.trigger("click");

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(hospitalCapacityButton.classes()).toContain("bg-primary");
    expect(modalEl.text()).toContain("Compare baseline scenario 30,500 against:");
  });

  it("warns about the adjustments to the values of dependent parameters, when relevant", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const hospitalCapacityButton = getHospitalCapacityButton(axisOptionsEl);
    await hospitalCapacityButton.trigger("click");

    expect(wrapper.find(".alert").exists()).toBe(false);

    // Click the already-selected parameter axis button to deselect it
    await hospitalCapacityButton.trigger("click");

    const countryButton = getCountryButton(axisOptionsEl);
    await countryButton.trigger("click");
    expect((wrapper.find(".alert")).exists()).toBe(true);
    expect(wrapper.find(".alert").text()).toContain("the scenarios will vary not only by country, but also by hospital surge capacity");
    expect(wrapper.find(".alert").text()).toContain("which will be set to a default value depending on each scenario's country parameter");
    expect(wrapper.find(".alert").text()).toContain("These values will be used for hospital surge capacity:");
    expect(wrapper.find(".alert").text()).toContain("United Kingdom: 26,200");

    const comboboxEl = getComboboxEl(wrapper);
    await comboboxEl.trigger("click");
    await wrapper.findAll(".menu .parameter-option").find(el => /United States/i.test(el.text()))!.trigger("click");
    await wrapper.findAll(".menu .parameter-option").find(el => /Thailand/i.test(el.text()))!.trigger("click");

    expect(wrapper.find(".alert").text()).toContain("United States: 334,400");
    expect(wrapper.find(".alert").text()).toContain("Thailand: 22,000");
  });

  it("renders the correct options for the select", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });
    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = getCountryButton(axisOptionsEl);
    await countryButton.trigger("click");

    // No country options are pre-selected
    expect(wrapper.find("button.multi-value").exists()).toBe(false);

    // Click the already-selected parameter axis button to deselect it
    await countryButton.trigger("click");

    const diseaseButton = getDiseaseButton(axisOptionsEl);
    await diseaseButton.trigger("click");

    const comboboxEl = getComboboxEl(wrapper);
    expect(comboboxEl.isVisible()).toBe(true);
    // Disease options are all pre-selected because there are fewer of them than MAX_COMPARISON_SCENARIOS
    const diseaseSelectedOptionsTags = wrapper.findAll("button.multi-value");
    expect(diseaseSelectedOptionsTags).toHaveLength(6);
    expect(diseaseSelectedOptionsTags.map(el => el.text())).toEqual(expect.arrayContaining(
      ["Covid-19 wild-type", "Covid-19 Omicron", "Covid-19 Delta", "Influenza 2009 (Swine flu)", "Influenza 1957", "Influenza 1918 (Spanish flu)"],
    ));

    // Click the already-selected disease axis button to deselect it
    await diseaseButton.trigger("click");

    const vaccineButton = getVaccineButton(axisOptionsEl);
    await vaccineButton.trigger("click");

    // Vaccine options are pre-selected and listed in the same order as they are in metadata
    const vaccineSelectedOptionsTags = wrapper.findAll("button.multi-value");
    expect(vaccineSelectedOptionsTags.map(el => el.text())).toEqual(["Low", "Medium", "High"]);

    // Click the already-selected parameter axis button to deselect it
    await vaccineButton.trigger("click");

    const hospitalCapacityButton = getHospitalCapacityButton(axisOptionsEl);
    await hospitalCapacityButton.trigger("click");

    // Since none of the default, max and min are the same as baseline, there are 3 predefined options.
    const hospitalCapacitySelectedOptionsTags = wrapper.findAll("button.multi-value");
    expect(hospitalCapacitySelectedOptionsTags.map(el => el.text())).toEqual(["23,600", "26,200", "34,100"]);
  });

  it("renders the validation feedback as expected, for invalid submissions", async () => {
    registerEndpoint("/api/scenarios", {
      method: "POST",
      async handler(event) {
        const body = JSON.parse(event.node.req.body);
        const params = body.parameters;

        if (params.pathogen === "sars_cov_1" && params.response === "none" && params.vaccine === "none") {
          switch (params.country) {
            case "GBR":
              return params.hospital_capacity === "26200" ? { runId: "ukRunId" } : errorResponseData;
            case "GRC":
              return params.hospital_capacity === "18200" ? { runId: "grRunId" } : errorResponseData;
            default:
              return errorResponseData;
          }
        }

        return errorResponseData;
      },
    });

    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });
    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = getCountryButton(axisOptionsEl);
    await countryButton.trigger("click");

    // Until submit button is clicked, there is no feedback shown
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("is-invalid");
    await wrapper.find("button[type='submit']").trigger("click");
    await flushPromises();
    expect(mockNavigateTo).not.toHaveBeenCalled();

    // Submit button is clicked, feedback is shown
    expect(wrapper.find(".invalid-tooltip").isVisible()).toBe(true);
    expect(wrapper.find(".vue-select").classes()).toContain("is-invalid");

    // Altering the selection removes the validation feedback
    const comboboxEl = getComboboxEl(wrapper);
    await comboboxEl.trigger("click");
    await wrapper.findAll(".menu .parameter-option").find(el => /greece/i.test(el.text()))!.trigger("click");
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("is-invalid");
    expect(wrapper.find(".vue-select").classes()).not.toContain("has-warning");

    await wrapper.find("button[type='submit']").trigger("click");
    await flushPromises();
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: "/comparison",
      query: {
        axis: "country",
        baseline: "GBR",
        runIds: "ukRunId;grRunId",
      },
    });
  });

  it("renders the warning feedback as expected, when numeric values are out of range, but allows form to submit", async () => {
    registerEndpoint("/api/scenarios", {
      method: "POST",
      async handler(event) {
        const body = JSON.parse(event.node.req.body);
        const params = body.parameters;

        if (params.pathogen === "sars_cov_1" && params.response === "none" && params.vaccine === "none"
          && params.country === "GBR"
        ) {
          switch (params.hospital_capacity) {
            case "345":
              return { runId: "customValueRunId" };
            case "23600":
              return { runId: "minValueRunId" };
            case "26200":
              return { runId: "defaultValueRunId" };
            case "30500":
              return { runId: "baselineValueRunId" };
            case "34100":
              return { runId: "maxValueRunId" };
            default:
              return errorResponseData;
          }
        }

        return errorResponseData;
      },
    });

    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });
    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const hospitalCapacityButton = getHospitalCapacityButton(axisOptionsEl);
    await hospitalCapacityButton.trigger("click");

    expect(wrapper.find(".invalid-tooltip.bg-warning").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("has-warning");

    const inputEl = wrapper.find("input.search-input");
    await inputEl.setValue(123);

    const customMenuOption = wrapper.find(".taggable-no-options");
    expect(customMenuOption.text()).toContain("Press enter to add custom option: 123");
    expect(customMenuOption.text()).toContain("This value is outside the estimated range for United Kingdom \(23600–34100\)");
    await customMenuOption.trigger("click");

    expect(wrapper.find(".invalid-tooltip.bg-warning").isVisible()).toBe(true);
    expect(wrapper.find(".vue-select").classes()).toContain("has-warning");
    expect(wrapper.find(".invalid-tooltip.bg-warning").text()).toContain("One of the values \(123\) lies outside of the estimated range for United Kingdom \(23600–34100\)");

    // Altering the selection removes the validation feedback
    await wrapper.findAll("button.multi-value").find(el => /123/.test(el.text()))!.trigger("click");

    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("has-warning");

    // Add another out-of-range custom value back in and verify form can be submitted
    await inputEl.setValue(345);
    await customMenuOption.trigger("click");

    expect(wrapper.find(".invalid-tooltip.bg-warning").isVisible()).toBe(true);

    await wrapper.find("button[type='submit']").trigger("click");

    await flushPromises();
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: "/comparison",
      query: {
        axis: "hospital_capacity",
        baseline: "30500",
        runIds: "baselineValueRunId;customValueRunId;minValueRunId;defaultValueRunId;maxValueRunId",
      },
    });
  });

  it("clears the choice of axis when the modal is closed", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = axisOptionsEl.findAll("button")[0];
    await countryButton.trigger("click");

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(countryButton.classes()).toContain("bg-primary");

    await wrapper.find(".btn-close").trigger("click");

    expect(getModalEl(wrapper).exists()).toBe(false);

    await openModal(wrapper);

    const newModalEl = getModalEl(wrapper);
    const newaxisOptionsEl = newModalEl.find("#axisOptions");

    expect(newModalEl.text()).not.toContain("Compare baseline scenario");
    expect(newaxisOptionsEl.findAll("button")).toHaveLength(5);
    newaxisOptionsEl.findAll("button").forEach((button) => {
      expect(button.classes()).not.toContain("bg-primary");
    });
  });

  it("on valid submission, it makes a POST request and navigates to the comparison", async () => {
    registerEndpoint("/api/scenarios", {
      method: "POST",
      async handler(event) {
        const body = JSON.parse(event.node.req.body);
        const params = body.parameters;

        if (params.pathogen === "sars_cov_1" && params.response === "none" && params.vaccine === "none") {
          switch (params.country) {
            case "GBR":
              return params.hospital_capacity === "26200" ? { runId: "ukRunId" } : errorResponseData;
            case "USA":
              return params.hospital_capacity === "334400" ? { runId: "usRunId" } : errorResponseData;
            case "THA":
              return params.hospital_capacity === "22000" ? { runId: "thRunId" } : errorResponseData;
            default:
              return errorResponseData;
          }
        }

        return errorResponseData;
      },
    });

    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = axisOptionsEl.findAll("button")[0];
    await countryButton.trigger("click");

    const comboboxEl = getComboboxEl(wrapper);
    await comboboxEl.trigger("click");
    await wrapper.findAll(".menu .parameter-option").find(el => /United States/i.test(el.text()))!.trigger("click");
    await wrapper.findAll(".menu .parameter-option").find(el => /Thailand/i.test(el.text()))!.trigger("click");

    const buttonEl = wrapper.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: "/comparison",
      query: {
        axis: "country",
        baseline: "GBR",
        runIds: "ukRunId;usRunId;thRunId",
      },
    });
  });
});
