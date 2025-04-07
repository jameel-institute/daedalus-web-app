import CreateComparison from "@/components/CreateComparison.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { flushPromises } from "@vue/test-utils";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";

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
  downloadError: "Test download error",
  metadata: mockMetadataResponseData as Metadata,
}, false, { stubActions: false });

const plugins = [testPinia];
vi.mock("~/components/utils/comparisons", () => ({
  MAX_COMPARISON_SCENARIOS: 10,
  MIN_COMPARISON_SCENARIOS: 2,
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

    expect(modalEl.text()).toMatch(/Which parameter would you like to explore?/);
    expect(modalEl.text()).not.toMatch(/Compare baseline scenario/);

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

    expect(modalEl.text()).toMatch(/Compare baseline scenario United Kingdom against:/);
    expect(getComboboxEl(wrapper).exists()).toBe(true);

    // Click the already-selected parameter axis button to deselect it
    await countryButton.trigger("click");

    // Hides the scenario selection section and reveals all parameter axis buttons
    expect(modalEl.text()).not.toMatch(/Compare baseline scenario/);
    expect(getComboboxEl(wrapper).exists()).toBe(false);
    expect(axisOptionsEl.findAll("button")).toHaveLength(5);
    axisOptionsEl.findAll("button").forEach((button) => {
      expect(button.classes()).not.toContain("bg-primary");
    });

    const diseaseButton = getDiseaseButton(axisOptionsEl);
    await diseaseButton.trigger("click");

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(diseaseButton.classes()).toContain("bg-primary");
    expect(modalEl.text()).toMatch(/Compare baseline scenario SARS 2004 against:/);
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
    expect(comboboxEl.exists()).toBe(true);
    // Disease options are all pre-selected because there are fewer of them than MAX_COMPARISON_SCENARIOS
    const selectedOptionsPills = wrapper.findAll("button.multi-value");
    expect(selectedOptionsPills).toHaveLength(6);
    expect(selectedOptionsPills.map(el => el.text())).toEqual(expect.arrayContaining(
      ["Covid-19 wild-type", "Covid-19 Omicron", "Covid-19 Delta", "Influenza 2009 (Swine flu)", "Influenza 1957", "Influenza 1918 (Spanish flu)"],
    ));
  });

  it("renders the validation feedback as expected", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });
    await openModal(wrapper);
    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const diseaseButton = getDiseaseButton(axisOptionsEl);
    await diseaseButton.trigger("click");

    // Deselect all disease options
    await wrapper.find(".clear-button").trigger("click");

    // Until submit button is clicked, there is no feedback shown
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    await wrapper.find("button[type='submit']").trigger("click");

    // Submit button is clicked, feedback is shown
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(true);
    expect(wrapper.find(".vue-select").classes()).toContain("is-invalid");

    // Altering the selection removes the validation feedback
    const comboboxEl = getComboboxEl(wrapper);
    await comboboxEl.trigger("click");
    await wrapper.findAll(".parameter-option").find(el => /wild-type/i.test(el.text()))!.trigger("click");
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
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

    expect(newModalEl.text()).not.toMatch(/Compare baseline scenario/);
    expect(newaxisOptionsEl.findAll("button")).toHaveLength(5);
    newaxisOptionsEl.findAll("button").forEach((button) => {
      expect(button.classes()).not.toContain("bg-primary");
    });
  });

  it("on valid submission, navigates to the comparison scenario", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = axisOptionsEl.findAll("button")[0];
    await countryButton.trigger("click");

    const comboboxEl = getComboboxEl(wrapper);
    await comboboxEl.trigger("click");
    await wrapper.findAll(".parameter-option").find(el => /United States/i.test(el.text()))!.trigger("click");
    await wrapper.findAll(".parameter-option").find(el => /Thailand/i.test(el.text()))!.trigger("click");

    const buttonEl = wrapper.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith({
      path: "/comparison",
      query: {
        axis: "country",
        ...mockResultData.parameters,
        scenarios: "USA;THA",
      },
    });

    // Page navigation should reset store downloadError
    const appStore = useAppStore();
    expect(appStore.downloadError).toBeUndefined();
  });
});
