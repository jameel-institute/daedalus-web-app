import ScenarioSelect from "@/components/ScenarioSelect.vue";
import { emptyScenario, mockPinia, mockResultData } from "@/tests/unit/mocks/mockPinia";
import type { VueWrapper } from "@vue/test-utils";
import { mount } from "@vue/test-utils";
import type { Metadata } from "~/types/apiResponseTypes";
import { describe, expect, it } from "vitest";
import { mockMetadataResponseData } from "../mocks/mockResponseData";

const stubs = {
  CIcon: true,
  CIconSvg: true,
};

const plugins = [mockPinia({
  currentScenario: {
    ...emptyScenario,
    parameters: mockResultData.parameters,
  },
  metadata: mockMetadataResponseData as Metadata,
}, false)];

const controlSelector = ".value-container.multi";
const pathogenParameter = mockMetadataResponseData.parameters.find(p => p.id === "pathogen")!;
const responseParameter = mockMetadataResponseData.parameters.find(p => p.id === "response")!;
const vaccineParameter = mockMetadataResponseData.parameters.find(p => p.id === "vaccine")!;
const hospitalCapacityParameter = mockMetadataResponseData.parameters.find(p => p.id === "hospital_capacity")!;

const getOptionFromMenu = (wrapper: VueWrapper, optionText: string) => {
  const matcher = new RegExp(optionText, "i");
  return wrapper.findAll(".parameter-option").find(el => matcher.test(el.text()));
};

const getOptionTagFromControl = (wrapper: VueWrapper, optionText: string) => {
  const matcher = new RegExp(optionText, "i");
  return wrapper.findAll("button.multi-value").find(el => matcher.test(el.text()));
};

const openMenu = async (wrapper: VueWrapper) => {
  await wrapper.find(controlSelector).trigger("click");
};

const enterAndSelectCustomOption = async (wrapper: VueWrapper, customValue: string) => {
  const inputEl = wrapper.find("input.search-input");
  await inputEl.setValue(Number(customValue));
  expect(wrapper.findAll(".parameter-option")).toHaveLength(0);
  const customMenuOption = wrapper.find(".taggable-no-options");
  const formattedCustomValue = new Intl.NumberFormat().format(Number(customValue));
  expect(customMenuOption.text()).toMatch(new RegExp(`Press enter to add custom option: ${formattedCustomValue}`));
  if (Number(customValue) < 23600 || Number(customValue) > 34100) {
    expect(customMenuOption.text()).toContain("This value is outside the estimated range for United Kingdom \(23600–34100\)");
  }
  await customMenuOption.trigger("click");
};

describe("scenario select", () => {
  it("renders as expected for non-numeric parameters", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: responseParameter,
        labelId: "formLabelId",
        selected: ["school_closures"],
      },
      global: { stubs, plugins },
    });

    const comboBox = wrapper.find(controlSelector);

    expect(comboBox.attributes("role")).toBe("combobox");
    expect(comboBox.attributes("aria-labelledby")).toBe("formLabelId");
    expect(comboBox.attributes("aria-required")).toBe("true");
    expect(comboBox.attributes("aria-description")).toBe("Select up to 5 options to compare against baseline");

    await openMenu(wrapper);

    // Assert option mark-up includes description text
    const businessClosuresOption = getOptionFromMenu(wrapper, "Business closures");
    expect(businessClosuresOption!.text()).toContain("A response strategy of mostly economic closures");
  });

  it("renders as expected for numeric parameters", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await openMenu(wrapper);

    const minimumOption = getOptionFromMenu(wrapper, "23,600");
    expect(minimumOption!.text()).toContain("Minimum for United Kingdom");
    const mediumOption = getOptionFromMenu(wrapper, "26,200");
    expect(mediumOption!.text()).toContain("Default for United Kingdom");
    const maximumOption = getOptionFromMenu(wrapper, "34,100");
    expect(maximumOption!.text()).toContain("Maximum for United Kingdom");

    await openMenu(wrapper);

    expect(wrapper.find(".menu").text()).toContain("Type a number to add a custom option, or select a pre-defined value from the list below");
  });

  it("refuses to accept a custom option that matches an already-selected option", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await enterAndSelectCustomOption(wrapper, "25000");

    expect(wrapper.findAll("button.multi-value")).toHaveLength(1);

    const inputEl = wrapper.find("input.search-input");
    await inputEl.setValue(25000);
    const customMenuOption = wrapper.find(".taggable-no-options");
    expect(customMenuOption.text()).toContain("25,000 is already selected");
    await customMenuOption.trigger("click");

    expect(wrapper.findAll("button.multi-value")).toHaveLength(1);
  });

  it("can update the v-model prop", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        "showValidationFeedback": false,
        "parameterAxis": pathogenParameter,
        "labelId": "formLabelId",
        "selected": ["sars_cov_2_pre_alpha"],
        "onUpdate:selected": (e: string[]) => wrapper.setProps({ selected: e }),
      },
      global: { stubs, plugins },
    });

    // sars_cov_2_pre_alpha option tag is present
    expect(wrapper.findAll("button.multi-value")).toHaveLength(1);
    expect(wrapper.findAll("button.multi-value")[0].text()).toMatch(/wild-type/i);

    await openMenu(wrapper);

    // Select 'omicron' option
    const omicronOption = getOptionFromMenu(wrapper, "omicron");
    await omicronOption!.trigger("click");

    expect(wrapper.props("selected")).toEqual(["sars_cov_2_pre_alpha", "sars_cov_2_omicron"]);
    // omicron option tag is now present
    expect(wrapper.findAll("button.multi-value")).toHaveLength(2);
    expect(wrapper.findAll("button.multi-value")[1].text()).toMatch(/omicron/i);

    // Deselect 'pre-alpha' option
    const wildTypeOption = getOptionTagFromControl(wrapper, "wild-type");
    await wildTypeOption!.trigger("click");

    expect(wrapper.props("selected")).toHaveLength(1);
    expect(wrapper.props("selected")).toEqual(["sars_cov_2_omicron"]);
  });

  it("renders the warning feedback as expected, when numeric values are out of range", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await enterAndSelectCustomOption(wrapper, "24000");

    expect(wrapper.find(".invalid-tooltip.bg-warning").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("has-warning");
    const inRangeTag = wrapper.find("button.multi-value");
    expect(inRangeTag.classes()).not.toContain("bg-warning");

    await enterAndSelectCustomOption(wrapper, "123");

    expect(wrapper.find(".invalid-tooltip.bg-warning").isVisible()).toBe(true);
    expect(wrapper.find(".vue-select").classes()).toContain("has-warning");
    expect(wrapper.find(".invalid-tooltip.bg-warning").text()).toContain("One of the values \(123\) lies outside of the estimated range for United Kingdom \(23600–34100\)");

    const outOfRangeTag = wrapper.find("button.multi-value");
    expect(outOfRangeTag.classes()).toContain("bg-warning");

    // Altering the selection removes the validation feedback
    await wrapper.findAll("button.multi-value.bg-warning.text-white").find(el => /123/.test(el.text()))!.trigger("click");

    expect(wrapper.find(".invalid-tooltip").exists()).toBe(false);
    expect(wrapper.find(".vue-select").classes()).not.toContain("has-warning");
  });

  it("can sort the v-model prop when the parameter metadata deems its options to have a defined order", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        "showValidationFeedback": false,
        "parameterAxis": vaccineParameter,
        "labelId": "formLabelId",
        "selected": ["medium"],
        "onUpdate:selected": (e: string[]) => wrapper.setProps({ selected: e }),
      },
      global: { stubs, plugins },
    });

    await openMenu(wrapper);

    const highOption = getOptionFromMenu(wrapper, "high");
    await highOption!.trigger("click");

    const lowOption = getOptionFromMenu(wrapper, "low");
    await lowOption!.trigger("click");

    expect(wrapper.props("selected")).toEqual(["low", "medium", "high"]);
  });

  it("can sort the v-model prop when the parameter is numeric", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await openMenu(wrapper);

    const maxOption = getOptionFromMenu(wrapper, "Maximum");
    await maxOption!.trigger("click");

    const minOption = getOptionFromMenu(wrapper, "Minimum");
    await minOption!.trigger("click");

    const medOption = getOptionFromMenu(wrapper, "Default");
    await medOption!.trigger("click");

    await enterAndSelectCustomOption(wrapper, "12345");

    expect(wrapper.props("selected")).toEqual(["12345", "23600", "26200", "34100"]);
  });

  it("does not list any custom options from the menu after the custom option is deselected by clicking", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await enterAndSelectCustomOption(wrapper, "12345");

    await openMenu(wrapper);
    expect(wrapper.findAll(".parameter-option")).toHaveLength(3);

    const customOptionTag = wrapper.find("button.multi-value");
    await customOptionTag.trigger("click");

    await openMenu(wrapper);
    expect(wrapper.findAll(".parameter-option")).toHaveLength(3);
  });

  it("does not list any custom options from the menu after the custom option is deselected by backspace", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    await enterAndSelectCustomOption(wrapper, "12345");

    await openMenu(wrapper);
    expect(wrapper.findAll(".parameter-option")).toHaveLength(3);

    const customOptionTag = wrapper.find("button.multi-value");
    expect(customOptionTag.isVisible()).toBe(true);
    await customOptionTag.trigger("keydown", { key: "Backspace" });

    await openMenu(wrapper);
    expect(wrapper.findAll(".parameter-option")).toHaveLength(3);
  });

  it("rejects non-numeric inputs for numeric parameters", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    const inputEl = wrapper.find("input.search-input");
    await inputEl.setValue("12345");
    expect((inputEl.element as HTMLInputElement).value).toBe("12345");
    await inputEl.setValue("12345abc");
    // Should revert to previous valid input
    expect((inputEl.element as HTMLInputElement).value).toBe("12345");
  });

  it("doesn't list as menu options any option that is the same as the baseline", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    const baselineOption = "sars_cov_1";
    const baselineOptionLabel = pathogenParameter.options!.find(o => o.id === baselineOption)!.label;

    await openMenu(wrapper);
    const menuOptions = wrapper.findAll(".parameter-option");
    expect(menuOptions).toHaveLength(6); // 6 options excluding the baseline
    expect(menuOptions.map(o => o.text()).join()).not.toMatch(new RegExp(baselineOptionLabel)); // Baseline option should not be present
  });

  it("doesn't list as menu options any option that is the same as the baseline, for numeric parameters", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: hospitalCapacityParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: {
        stubs,
        plugins: [mockPinia({
          currentScenario: {
            ...emptyScenario,
            parameters: {
              ...mockResultData.parameters,
              hospital_capacity: "26200", // Set the baseline to the default value
            },
          },
          metadata: mockMetadataResponseData as Metadata,
        }, false)],
      },
    });
    await openMenu(wrapper);
    const menuOptions = wrapper.findAll(".parameter-option");
    expect(menuOptions).toHaveLength(2); // 2 options excluding the baseline
    expect(menuOptions.map(o => o.text()).join()).not.toMatch(/26,200/); // Baseline option should not be present
  });

  it("initializes closed, opens when control is clicked, and stays open after selection is changed", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: ["sars_cov_2_pre_alpha"],
      },
      global: { stubs, plugins },
    });

    const selectContainer = wrapper.find(".vue-select");
    expect(selectContainer.classes()).not.toContain("open");

    await openMenu(wrapper);

    expect(selectContainer.classes()).toContain("open");

    // Select 'omicron' option
    const omicronOption = getOptionFromMenu(wrapper, "omicron");
    await omicronOption!.trigger("click");

    expect(selectContainer.classes()).toContain("open");

    // Deselect 'pre-alpha' option
    const preAlphaOption = getOptionTagFromControl(wrapper, "wild-type");
    await preAlphaOption!.trigger("click");

    expect(selectContainer.classes()).toContain("open");
  });

  it("selecting all options closes the menu", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: false,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: ["sars_cov_2_pre_alpha"],
      },
      global: { stubs, plugins },
    });

    await openMenu(wrapper);

    const selectContainer = wrapper.find(".vue-select");
    expect(selectContainer.classes()).toContain("open");

    // Select all options
    const menuOptions = wrapper.findAll(".parameter-option");
    menuOptions.forEach(option => option.trigger("click"));
    await wrapper.vm.$nextTick();

    expect(selectContainer.classes()).not.toContain("open");
  });

  it("displays validation feedbacks when showValidationFeedback is true", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: true,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    const feedback = wrapper.find(".invalid-tooltip");
    expect(feedback.isVisible()).toBe(true);
    expect(feedback.text()).toContain("Please select at least 1 scenario to compare against the baseline");

    await openMenu(wrapper);
    // Select all options
    const options = wrapper.findAll(".parameter-option");
    options.forEach(option => option.trigger("click"));
    await wrapper.vm.$nextTick();

    expect(feedback.text()).toContain("You can compare up to 5 scenarios against the baseline");
    expect(feedback.isVisible()).toBe(true);
  });

  it("lets the user know if there are no more options to be selected", async () => {
    const allNonBaselineOptions = pathogenParameter!.options!.filter(o => o.id !== mockResultData.parameters.pathogen);

    const wrapper = mount(ScenarioSelect, {
      props: {
        showValidationFeedback: true,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: allNonBaselineOptions.map(o => o.id),
      },
      global: { stubs, plugins },
    });

    const searchInput = wrapper.find("input");
    searchInput.setValue("query that will match no options");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("All options selected");

    // Deselect 'pre-alpha' option
    const preAlphaOption = getOptionTagFromControl(wrapper, "wild-type");
    await preAlphaOption!.trigger("click");

    searchInput.setValue("query that will match no options");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("No options found");
  });
});
