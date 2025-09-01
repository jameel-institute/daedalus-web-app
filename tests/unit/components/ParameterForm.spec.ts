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
const plugins = [mockPinia({}, true, { stubActions: false })];

// Need to do this in hoisted - see https://developer.mamezou-tech.com/en/blogs/2024/02/12/nuxt3-unit-testing-mock/
const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));
mockNuxtImport("navigateTo", () => mockNavigateTo);

vi.mock("country-iso-3-to-2", () => ({
  default: vi.fn((countryId: string) => {
    switch (countryId) {
      case "CLD":
        return "cl";
      case "HVN":
        return "hv";
    }
  }),
}));

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
      global: { stubs, plugins },
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
    const renderedOptions = vueSelects[0].findAll(".menu .parameter-option");
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
    expect(vueSelects[1].find(".single-value span.fi").classes()).toContain("fi-hv"); // flag
    await vueSelects[1].find(".dropdown-icon").trigger("click");
    const renderedCountryOptions = vueSelects[1].findAll(".menu .parameter-option");
    expect(renderedCountryOptions.length).toBe(2);
    expect(renderedCountryOptions[0].text()).toBe("Cloud Nine");
    expect(renderedCountryOptions[0].find(".fi").classes()).toContain("fi-cl"); // flag

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
      global: { stubs, plugins },
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
      global: {
        stubs,
        plugins: [mockPinia(
          { currentScenario: scenarioWithParameters },
          true,
          { stubActions: false },
        )],
      },
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
      global: {
        stubs,
        plugins: [mockPinia(
          { currentScenario: scenarioWithParameters },
          true,
          { stubActions: false },
        )],
      },
    });

    const submitButton = component.find("button[type='submit']");
    expect(submitButton.element.disabled).toBe(true);

    const vueSelect = component.findComponent(VueSelect);
    await vueSelect.vm.$emit("update:modelValue", "2");
    expect(submitButton.element.disabled).toBe(false);
  });

  it("does not show the 'advanced usage' popover button when not in a modal", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: {
        stubs,
        plugins: [mockPinia(
          { currentScenario: scenarioWithParameters },
          true,
          { stubActions: false },
        )],
      },
    });

    const popoverContainer = component.find("#advanced-usage-popover-container");
    expect(popoverContainer.classes()).toContain("d-none");
    expect(popoverContainer.classes()).not.toContain("d-flex");
  });

  it("shows the 'advanced usage' popover button when not in a modal", async () => {
    vi.useFakeTimers();

    const component = await mountSuspended(ParameterForm, {
      props: { inModal: true },
      global: {
        stubs,
        plugins: [mockPinia(
          { currentScenario: scenarioWithParameters },
          true,
          { stubActions: false },
        )],
      },
    });

    const popoverContainer = component.find("#advanced-usage-popover-container");
    expect(popoverContainer.classes()).toContain("d-flex");
    expect(popoverContainer.classes()).not.toContain("d-none");

    expect(component.text()).not.toContain("R users can run the model directly");

    await popoverContainer.findAll("p").find(p => p.text() === "Advanced usage")!.trigger("click");

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(component.text()).toContain("R users can run the model directly");

    vi.useRealTimers();
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
      global: { stubs, plugins: [mockPinia({ metadata }, false, { stubActions: false })] },
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
      global: { stubs, plugins },
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
      global: { stubs, plugins },
    });

    const buttonEl = component.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith("/scenarios/randomId");
  });

  it("does not submit the form if values are invalid", async () => {
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
        plugins: [mockPinia()],
      },
    });

    const numericInput = component.find("input[type='number'][id='population']");
    const feedbackElement = component.find(".invalid-tooltip");
    // Expect the classes of the input not to contain is-invalid - this is our test of whether the feedback is visible.
    expect(numericInput.classes()).not.toContain("is-invalid");
    await numericInput.setValue("0"); // Invalid value

    expect(numericInput.classes()).toContain("is-invalid");
    expect(feedbackElement.text()).toContain("The field must contain a positive value.");

    const buttonEl = component.find("button[type='submit']");
    await buttonEl.trigger("click");

    await flushPromises();
    expect(mockNavigateTo).not.toBeCalledWith("/scenarios/randomId");
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
        }, false, { stubActions: false })],
      },
    });

    expect(component.findComponent({ name: "CAlert" }).exists()).toBe(true);
    expect(component.text()).toContain("Failed to initialise.");
    expect(component.text()).toContain("There was a bee-related issue.");
  });

  it("displays CSpinner when metadata is not defined and there is no error", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ metadata: undefined }, false, { stubActions: false })] },
    });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);
  });

  it("shows warning messages for out-of-range numeric values, but allows form submission", async () => {
    registerEndpoint("/api/scenarios", {
      method: "POST",
      handler: async () => ({ runId: "randomId" }),
    });

    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins },
    });

    const numericInput = component.find("input[type='number'][id='population']");

    // Value within range should not have warning class
    await numericInput.setValue(2500);
    await nextTick();

    expect(numericInput.element.parentElement?.classList).not.toContain("has-warning");
    expect(numericInput.classes()).not.toContain("is-invalid");

    // Value outside range should have warning class
    await numericInput.setValue(5000);
    await nextTick();

    expect(numericInput.element.parentElement?.classList).toContain("has-warning");
    expect(numericInput.classes()).toContain("is-invalid");
    const feedbackElement = component.find(".invalid-tooltip");
    expect(feedbackElement.text()).toContain(`NB: This value is outside the estimated range for No (1000–4000). Proceed with caution.`);

    await component.find("button[type='submit']").trigger("click");

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith("/scenarios/randomId");
  });
});
