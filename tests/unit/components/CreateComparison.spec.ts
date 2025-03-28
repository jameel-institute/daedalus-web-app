import CreateComparison from "@/components/CreateComparison.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
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
  wrapper.find("button").trigger("click");
  await wrapper.vm.$nextTick();
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

  it("renders fields, options, and validation feedback as expected", async () => {
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

    const countryButton = axisButtons[0];

    countryButton.trigger("click");
    await wrapper.vm.$nextTick();

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(countryButton.classes()).toContain("bg-primary");

    // Reveals the scenario selection section
    expect(modalEl.text()).toMatch(/Compare baseline scenario United Kingdom against:/);
    expect(getComboboxEl(wrapper).exists()).toBe(true);
    // No country options are pre-selected
    expect(wrapper.find("button.multi-value").exists()).toBe(false);
    // TODO: Test tooltip

    // Click the already-selected parameter axis button to deselect it
    countryButton.trigger("click");
    await wrapper.vm.$nextTick();

    // Hides the scenario selection section and reveals all parameter axis buttons
    expect(modalEl.text()).not.toMatch(/Compare baseline scenario/);
    expect(getComboboxEl(wrapper).exists()).toBe(false);
    expect(axisOptionsEl.findAll("button")).toHaveLength(5);
    axisButtons.forEach((button) => {
      expect(button.classes()).not.toContain("bg-primary");
    });

    const diseaseButton = axisOptionsEl.findAll("button")[1];
    diseaseButton.trigger("click");
    await wrapper.vm.$nextTick();

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(diseaseButton.classes()).toContain("bg-primary");
    expect(modalEl.text()).toMatch(/Compare baseline scenario SARS 2004 against:/);
    const comboboxEl = getComboboxEl(wrapper);
    expect(comboboxEl.exists()).toBe(true);
    // Disease options are all pre-selected because there are fewer of them than MAX_COMPARISON_SCENARIOS
    const selectedOptionsPills = wrapper.findAll("button.multi-value");
    expect(selectedOptionsPills).toHaveLength(6);
    expect(selectedOptionsPills.map(el => el.text())).toEqual(expect.arrayContaining(
      ["Covid-19 wild-type", "Covid-19 Omicron", "Covid-19 Delta", "Influenza 2009 (Swine flu)", "Influenza 1957", "Influenza 1918 (Spanish flu)"],
    ));

    // Deselect all disease options
    wrapper.find(".clear-button").trigger("click");
    await wrapper.vm.$nextTick();

    // Until submit button is clicked, there is no feedback shown
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    await wrapper.find("button[type='submit']").trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".invalid-tooltip").exists()).toBe(true);
    expect(wrapper.find(".vue-select").classes()).toContain("is-invalid");

    // Altering the selection removes the validation feedback
    comboboxEl.trigger("click");
    await wrapper.vm.$nextTick();
    wrapper.findAll(".parameter-option").find(el => /wild-type/i.test(el.text()))!.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
  });

  it("clears the choice of axis when the modal is closed", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = axisOptionsEl.findAll("button")[0];
    countryButton.trigger("click");
    await wrapper.vm.$nextTick();

    expect(axisOptionsEl.findAll("button")).toHaveLength(1);
    expect(countryButton.classes()).toContain("bg-primary");

    wrapper.find(".btn-close").trigger("click");
    await wrapper.vm.$nextTick();

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

  it("on valid submission, sets the app store comparison, and navigates to the comparison scenario", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    const modalEl = getModalEl(wrapper);
    const axisOptionsEl = modalEl.find("#axisOptions");
    const countryButton = axisOptionsEl.findAll("button")[0];
    countryButton.trigger("click");
    await wrapper.vm.$nextTick();

    const comboboxEl = getComboboxEl(wrapper);
    comboboxEl.trigger("click");
    await wrapper.vm.$nextTick();
    wrapper.findAll(".parameter-option").find(el => /United States/i.test(el.text()))!.trigger("click");
    await wrapper.vm.$nextTick();

    const buttonEl = wrapper.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");
    await wrapper.vm.$nextTick();

    const appStore = useAppStore();
    expect(appStore.currentComparison.axis).toEqual("country");
    expect(appStore.currentComparison.baseline).toEqual("GBR");
    expect(appStore.currentComparison.scenarios).toHaveLength(2);
    expect(appStore.currentComparison.scenarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          {
            runId: undefined,
            parameters: {
              country: "GBR",
              pathogen: "sars_cov_1",
              response: "none",
              vaccine: "none",
              hospital_capacity: "30500",
            },
            result: { data: undefined, fetchError: undefined, fetchStatus: undefined },
            status: { data: undefined, fetchError: undefined, fetchStatus: undefined },
          },
        ),
        expect.objectContaining({
          runId: undefined,
          parameters: {
            country: "USA",
            pathogen: "sars_cov_1",
            response: "none",
            vaccine: "none",
            hospital_capacity: "30500",
          },
          result: { data: undefined, fetchError: undefined, fetchStatus: undefined },
          status: { data: undefined, fetchError: undefined, fetchStatus: undefined },
        }),
      ]),
    );

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith({
      path: "/comparison",
      query: {
        axis: "country",
        ...mockResultData.parameters,
        selectedScenarios: ["USA"],
      },
    });

    // Page navigation should reset store downloadError
    expect(appStore.downloadError).toBeUndefined();
  });

  it("on closing the modal, triggers the edit params to stop pulsing", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    wrapper.find(".btn-close").trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()).not.toHaveProperty("toggleEditParamsButtonPulse");

    vi.advanceTimersByTime(2000);

    expect(wrapper.emitted("toggleEditParamsButtonPulse")).toHaveLength(1);
    // 'false' denotes stopping the pulse
    expect(wrapper.emitted("toggleEditParamsButtonPulse")?.[0][0]).toEqual(false);
  });

  it("on showing the tooltip, triggers the edit params button to pulse", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    getModalEl(wrapper).find("#axisOptions").findAll("button")[0].trigger("click");
    await wrapper.vm.$nextTick();

    const cTooltip = wrapper.findComponent({ name: "CTooltip" });
    cTooltip.vm.$emit("show");

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("toggleEditParamsButtonPulse")).toHaveLength(1);
    // 'true' denotes starting the pulse
    expect(wrapper.emitted("toggleEditParamsButtonPulse")?.[0][0]).toEqual(true);
    vi.advanceTimersByTime(10_000);
    // no change
    expect(wrapper.emitted("toggleEditParamsButtonPulse")).toHaveLength(1);
  });

  it("on hiding the tooltip, triggers the edit params button to stop pulsing, after a delay", async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    getModalEl(wrapper).find("#axisOptions").findAll("button")[0].trigger("click");
    await wrapper.vm.$nextTick();

    const cTooltip = wrapper.findComponent({ name: "CTooltip" });
    cTooltip.vm.$emit("hide");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()).not.toHaveProperty("toggleEditParamsButtonPulse");
    vi.advanceTimersByTime(3000);

    expect(wrapper.emitted("toggleEditParamsButtonPulse")).toHaveLength(1);
    // 'false' denotes stopping the pulse
    expect(wrapper.emitted("toggleEditParamsButtonPulse")?.[0][0]).toEqual(false);
  });

  it(`on closing the modal, if hiding the tooltip has not already triggered the edit params button to stop pulsing,`
    + `it should restart the countdown and stop the pulse after a delay`, async () => {
    const wrapper = await mountSuspended(CreateComparison, { global: { stubs, plugins } });

    await openModal(wrapper);

    getModalEl(wrapper).find("#axisOptions").findAll("button")[0].trigger("click");
    await wrapper.vm.$nextTick();

    const cTooltip = wrapper.findComponent({ name: "CTooltip" });
    cTooltip.vm.$emit("hide");
    await wrapper.vm.$nextTick();

    vi.advanceTimersByTime(2500);
    expect(wrapper.emitted()).not.toHaveProperty("toggleEditParamsButtonPulse");

    wrapper.find(".btn-close").trigger("click");
    await wrapper.vm.$nextTick();

    vi.advanceTimersByTime(1500);
    expect(wrapper.emitted()).not.toHaveProperty("toggleEditParamsButtonPulse");

    vi.advanceTimersByTime(500);
    expect(wrapper.emitted("toggleEditParamsButtonPulse")).toHaveLength(1);
    // 'false' denotes stopping the pulse
    expect(wrapper.emitted("toggleEditParamsButtonPulse")?.[0][0]).toEqual(false);
  });
});
