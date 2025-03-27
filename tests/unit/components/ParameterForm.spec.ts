import ParameterForm from "@/components/ParameterForm.vue";
import { emptyScenario, mockedMetadata, mockPinia, updatableNumericParameter } from "@/tests/unit/mocks/mockPinia";
import { CButtonGroup, CTooltip } from "@coreui/vue";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { FetchError } from "ofetch";
import VueSelect from "vue3-select-component";
import ParameterHeader from "~/components/ParameterHeader.vue";

const stubs = {
  CIcon: true,
};

// Need to do this in hoisted - see https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));
mockNuxtImport("navigateTo", () => mockNavigateTo);

const scenarioWithParameters = {
  ...emptyScenario,
  parameters: {
    long_list: "3",
    region: "CLD",
    population: "25000",
    short_list: "yes",
  },
};

describe("parameter form", () => {
  beforeEach(() => {
    mockNavigateTo.mockReset();
  });

  it("renders the correct parameter labels, inputs, options, and default values", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia()] },
    });

    expect(component.text()).toContain("Region");
    expect(component.text()).toContain("Drop Down");
    expect(component.text()).toContain("Radio Buttons");
    expect(component.text()).toContain("Population");

    const headers = component.findAllComponents(ParameterHeader);
    headers.forEach((header, index) => {
      expect(header.props("parameter")).toStrictEqual(mockedMetadata.parameters[index]);
    });

    const vueSelects = component.findAllComponents(VueSelect);
    expect(vueSelects.length).toBe(2);

    vueSelects.forEach((vueSelect, index) => {
      const correctLabel = ["Drop Down", "Region"][index];
      const paramId = vueSelect.props("inputId");
      expect(component.find(`label[for=${paramId}]`).element.textContent).toBe(correctLabel);
      expect(vueSelect.props("aria")).toStrictEqual({ labelledby: `${paramId}-label`, required: true });
    });

    expect(vueSelects[0].props("options")).toEqual([
      { value: "1", label: "Option 1", description: "Option 1 description" },
      { value: "2", label: "Option 2", description: "Option 2 description" },
      { value: "3", label: "Option 3", description: "Option 3 description" },
      { value: "4", label: "Option 4", description: "Option 4 description" },
      { value: "5", label: "Option 5", description: "Option 5 description" },
      { value: "6", label: "Option 6", description: "" },
    ]);
    expect(vueSelects[0].props("modelValue")).toBe("1");

    await vueSelects[0].find(".dropdown-icon").trigger("click");
    const renderedOptions = vueSelects[0].findAll(".parameter-option");
    expect(renderedOptions.length).toBe(6);
    expect(renderedOptions[0].find("span").text()).toBe("Option 1");
    expect(renderedOptions[0].find("div.text-dark").text()).toBe("Option 1 description");
    expect(renderedOptions[1].find("span").text()).toBe("Option 2");
    expect(renderedOptions[1].find("div.text-muted").text()).toBe("Option 2 description");
    expect(renderedOptions[5].find("span").text()).toBe("Option 6");
    expect(renderedOptions[5].find("div.text-muted").exists()).toBe(false);

    expect(vueSelects[1].props("options")).toEqual([
      { value: "CLD", label: "Cloud Nine", description: "" },
      { value: "HVN", label: "Heaven", description: "" },
    ]);
    expect(vueSelects[1].props("modelValue")).toBe("HVN");

    const numericInput = component.find("input[type='number']");
    expect(numericInput.element.value).toBe("2000");

    // As this parameter's options are all single words and there aren't more than 4, it should render as radio buttons.
    const buttonGroupLabel = component.find(".button-group-container").find("label");
    expect(buttonGroupLabel.element.attributes.getNamedItem("for")!.value).toBe("short_list");
    expect(buttonGroupLabel.text()).toBe("Radio Buttons");
    const shortList = component.findComponent({ name: "CButtonGroup" });
    expect(shortList.findAll("input").map((input) => {
      return { value: input.element.value, label: input.element.labels![0].textContent, checked: input.element.checked };
    })).toEqual([
      { value: "yes", label: "Yes", checked: false },
      { value: "no", label: "No", checked: true },
    ]);

    const submitButton = component.find("button[type='submit']");
    expect(submitButton.element.disabled).toBe(false);
  });

  it("renders Tooltips for radio buttons", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia()] },
    });
    const radioGroup = component.findComponent(CButtonGroup);
    const tooltips = radioGroup.findAllComponents(CTooltip);
    expect(tooltips.length).toBe(2);
    expect(tooltips[0].props("content")).toBe("Yes description");
    expect(tooltips[1].props("content")).toBe(undefined);
  });

  it("renders the current parameter values if the app store contains a current scenario", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithParameters })] },
    });

    const vueSelects = component.findAllComponents(VueSelect);

    expect(vueSelects[0].props("options")).toEqual([
      { value: "1", label: "Option 1", description: "Option 1 description" },
      { value: "2", label: "Option 2", description: "Option 2 description" },
      { value: "3", label: "Option 3", description: "Option 3 description" },
      { value: "4", label: "Option 4", description: "Option 4 description" },
      { value: "5", label: "Option 5", description: "Option 5 description" },
      { value: "6", label: "Option 6", description: "" },
    ]);
    expect(vueSelects[0].props("modelValue")).toBe("3");

    expect(vueSelects[1].props("options")).toEqual([
      { value: "CLD", label: "Cloud Nine", description: "" },
      { value: "HVN", label: "Heaven", description: "" },
    ]);
    expect(vueSelects[1].props("modelValue")).toBe("CLD");

    const numericInput = component.find("input[type='number']");
    expect(numericInput.element.value).toBe("25000");

    const shortList = component.findComponent({ name: "CButtonGroup" });
    expect(shortList.findAll("input").map((input) => {
      return { value: input.element.value, label: input.element.labels![0].textContent, checked: input.element.checked };
    })).toEqual([
      { value: "yes", label: "Yes", checked: true },
      { value: "no", label: "No", checked: false },
    ]);
  });

  it("sets the submit button to disabled when the component is rendered within a modal, until the inputs differ from current scenario", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: true },
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithParameters })] },
    });

    const submitButton = component.find("button[type='submit']");
    expect(submitButton.element.disabled).toBe(true);

    const vueSelect = component.findComponent(VueSelect);
    await vueSelect.vm.$emit("update:modelValue", "2");
    expect(submitButton.element.disabled).toBe(false);
  });

  it("updates the numeric input's min, max, and default values based on the selected option", async () => {
    const maskStockpileParameter = {
      ...updatableNumericParameter,
      id: "mask_stockpile",
      label: "Mask stockpile",
      step: 1,
      updateNumericFrom: {
        parameterId: "long_list",
        values: {
          1: { min: 1, default: 2, max: 3 },
          2: { min: 4, default: 5, max: 6 },
          3: { min: 7, default: 8, max: 9 },
          4: { min: 10, default: 11, max: 12 },
          5: { min: 13, default: 14, max: 15 },
          6: { min: 16, default: 17, max: 18 },
        },
      },
    };

    const metadata = {
      ...mockedMetadata,
      parameters: [...mockedMetadata.parameters, maskStockpileParameter],
    };

    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ metadata })] },
    });

    const vueSelect = component.findComponent(VueSelect);
    const stockpileNumericInput = component.find("input[type='number'][id='mask_stockpile']");
    const stockpileRangeInput = component.find("input[type='range'][id='mask_stockpile']");

    expect(stockpileNumericInput.element.value).toBe("2");
    expect(stockpileRangeInput.element.value).toBe("2");
    expect(stockpileNumericInput.element.min).toBe("1");
    expect(stockpileNumericInput.element.max).toBe("3");

    await vueSelect.vm.$emit("update:modelValue", "4");
    await vueSelect.vm.$emit("option-selected");

    expect(stockpileNumericInput.element.value).toBe("11");
    expect(stockpileRangeInput.element.value).toBe("11");
    expect(stockpileNumericInput.element.min).toBe("10");
    expect(stockpileNumericInput.element.max).toBe("12");

    const shortList = component.findComponent({ name: "CButtonGroup" });
    const populationNumericInput = component.find("input[type='number'][id='population']");
    const populationRangeInput = component.find("input[type='range'][id='population']");

    expect(populationNumericInput.element.value).toBe("2000");
    expect(populationRangeInput.element.value).toBe("2000");
    expect(populationRangeInput.element.min).toBe("1000");
    expect(populationRangeInput.element.max).toBe("4000");

    await shortList.find("input[value='yes']").setChecked();
    await nextTick();

    expect(populationNumericInput.element.value).toBe("17000");
    expect(populationRangeInput.element.value).toBe("17000");
    expect(populationRangeInput.element.min).toBe("11000");
    expect(populationRangeInput.element.max).toBe("50000");

    await shortList.find("input[value='no']").setChecked();
    await nextTick();

    expect(populationNumericInput.element.value).toBe("2000");
    expect(populationRangeInput.element.value).toBe("2000");
    expect(populationRangeInput.element.min).toBe("1000");
    expect(populationRangeInput.element.max).toBe("4000");
  });

  it("resets a numeric input that can be updated from another input to its default value when the reset button is clicked", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia()] },
    });

    const numericInput = component.find("input[type='number'][id='population']");
    const rangeInput = component.find("input[type='range'][id='population']");
    expect(numericInput.element.value).toBe("2000");
    expect(rangeInput.element.value).toBe("2000");

    await numericInput.setValue(2100);
    expect(rangeInput.element.value).toBe("2100");

    const resetButton = component.find("button[aria-label='Reset Population to default']");
    await resetButton.trigger("click");

    expect(numericInput.element.value).toBe("2000");
    expect(rangeInput.element.value).toBe("2000");
  });

  it("displays feedback when the form is submitted with invalid values", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia()] },
    });

    const numericInput = component.find("input[type='number'][id='population']");
    const feedbackElement = component.find(".invalid-tooltip");
    // Expect the classes of the input not to contain is-invalid - this is our test of whether the feedback is visible.
    expect(numericInput.classes()).not.toContain("is-invalid");

    await numericInput.setValue(0);
    expect(numericInput.classes()).not.toContain("is-invalid");

    await component.find("button[type='submit']").trigger("click");
    expect(numericInput.classes()).toContain("is-invalid");
    expect(feedbackElement.text()).toContain(`1000 to 4000 is the allowed population range for No.`);

    await numericInput.setValue(2000);
    expect(numericInput.classes()).not.toContain("is-invalid");
  });

  it("sends a POST request to /api/scenarios with the form data when submitted", async () => {
    registerEndpoint("/api/scenarios", {
      method: "POST",
      async handler(event) {
        const body = JSON.parse(event.node.req.body);
        const parameters = body.parameters;

        if (parameters.long_list === "1" && parameters.region === "HVN" && parameters.short_list === "no") {
          return { runId: "randomId" };
        } else {
          return { error: "Test failed due to wrong parameters" };
        }
      },
    });

    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: {
        stubs,
        plugins: [mockPinia({
          downloadError: "test error",
        })],
      },
    });

    const buttonEl = component.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith("/scenarios/randomId");

    // submit should also reset download error
    const store = (component.vm as any).appStore;
    expect(store.downloadError).toBeUndefined();
  });

  it("displays CAlert with error message when metadataFetchStatus is 'error'", async () => {
    const error = new FetchError("There was a bee-related issue.");

    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: {
        stubs,
        plugins: [mockPinia({
          metadata: undefined,
          metadataFetchStatus: "error",
          metadataFetchError: error,
        }, false)],
      },
    });

    expect(component.findComponent({ name: "CAlert" }).exists()).toBe(true);
    expect(component.text()).toContain("Failed to initialise.");
    expect(component.text()).toContain("There was a bee-related issue.");
  });

  it("displays CSpinner when metadata is not defined and there is no error", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ metadata: undefined }, false)] },
    });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);
  });

  it("form data reverts to previous values if update includes falsy values", async () => {
    // Do a valid update from default
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithParameters })] },
    });
    const vueSelect = component.findComponent(VueSelect);
    await vueSelect.vm.$emit("update:modelValue", "2");
    const expectedFormData = { ...scenarioWithParameters.parameters, long_list: "2" };
    expect(component.vm.formData.value).toStrictEqual(expectedFormData);

    // Do an invalid update - should revert to the first update
    await vueSelect.vm.$emit("update:modelValue", undefined);
    expect(component.vm.formData.value).toStrictEqual(expectedFormData);
  });
});
