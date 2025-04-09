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
const pathogenParameter = mockMetadataResponseData.parameters.find(p => p.id === "pathogen");

const getOptionFromMenu = (wrapper: VueWrapper, optionText: string) => {
  const matcher = new RegExp(optionText, "i");
  return wrapper.findAll(".parameter-option").find(el => matcher.test(el.text()));
};

const getOptionTagFromControl = (wrapper: VueWrapper, optionText: string) => {
  const matcher = new RegExp(optionText, "i");
  return wrapper.findAll("button.multi-value").find(el => matcher.test(el.text()));
};

describe("scenario select", () => {
  it("renders as expected", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showFeedback: false,
        parameterAxis: mockMetadataResponseData.parameters.find(p => p.id === "response"),
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

    await wrapper.find(controlSelector).trigger("click");

    // Assert option mark-up includes description text
    const businessClosuresOption = getOptionFromMenu(wrapper, "Business closures");
    expect(businessClosuresOption!.text()).toMatch(/A response strategy of mostly economic closures/);
  });

  it("can update the v-model prop", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        "showFeedback": false,
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

    // Open menu
    await wrapper.find(controlSelector).trigger("click");

    // Select 'omicron' option
    const omicronOption = getOptionFromMenu(wrapper, "omicron");
    await omicronOption!.trigger("click");

    expect(wrapper.props("selected")).toHaveLength(2);
    expect(wrapper.props("selected")).toEqual(expect.arrayContaining(["sars_cov_2_pre_alpha", "sars_cov_2_omicron"]));
    // omicron option tag is now present
    expect(wrapper.findAll("button.multi-value")).toHaveLength(2);
    expect(wrapper.findAll("button.multi-value")[1].text()).toMatch(/omicron/i);

    // Deselect 'pre-alpha' option
    const wildTypeOption = getOptionTagFromControl(wrapper, "wild-type");
    await wildTypeOption!.trigger("click");

    expect(wrapper.props("selected")).toHaveLength(1);
    expect(wrapper.props("selected")).toEqual(expect.arrayContaining(["sars_cov_2_omicron"]));
  });

  it("initializes closed, opens when control is clicked, and stays open after selection is changed", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showFeedback: false,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: ["sars_cov_2_pre_alpha"],
      },
      global: { stubs, plugins },
    });

    const selectContainer = wrapper.find(".vue-select");
    expect(selectContainer.classes()).not.toContain("open");

    const comboBox = wrapper.find(controlSelector);
    await comboBox.trigger("click");

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
        showFeedback: false,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: ["sars_cov_2_pre_alpha"],
      },
      global: { stubs, plugins },
    });

    const comboBox = wrapper.find(controlSelector);
    await comboBox.trigger("click");

    const selectContainer = wrapper.find(".vue-select");
    expect(selectContainer.classes()).toContain("open");

    // Select all options
    const menuOptions = wrapper.findAll(".parameter-option");
    menuOptions.forEach(option => option.trigger("click"));
    await wrapper.vm.$nextTick();

    expect(selectContainer.classes()).not.toContain("open");
  });

  it("displays validation feedbacks when showFeedback is true", async () => {
    const wrapper = mount(ScenarioSelect, {
      props: {
        showFeedback: true,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: [],
      },
      global: { stubs, plugins },
    });

    const feedback = wrapper.find(".invalid-tooltip");
    expect(feedback.text()).toMatch(/Please select at least 1 scenario to compare against the baseline/i);

    // Open menu and select all options
    await wrapper.find(controlSelector).trigger("click");

    const options = wrapper.findAll(".parameter-option");
    options.forEach(option => option.trigger("click"));
    await wrapper.vm.$nextTick();

    expect(feedback.text()).toMatch(/You can compare up to 5 scenarios against the baseline/i);
  });

  it("lets the user know if there are no more options to be selected", async () => {
    const allNonBaselineOptions = pathogenParameter!.options!.filter(o => o.id !== mockResultData.parameters.pathogen);

    const wrapper = mount(ScenarioSelect, {
      props: {
        showFeedback: true,
        parameterAxis: pathogenParameter,
        labelId: "formLabelId",
        selected: allNonBaselineOptions.map(o => o.id),
      },
      global: { stubs, plugins },
    });

    const searchInput = wrapper.find("input");
    searchInput.setValue("query that will match no options");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toMatch(/All options selected/i);

    // Deselect 'pre-alpha' option
    const preAlphaOption = getOptionTagFromControl(wrapper, "wild-type");
    await preAlphaOption!.trigger("click");

    searchInput.setValue("query that will match no options");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toMatch(/No options found/i);
  });
});
