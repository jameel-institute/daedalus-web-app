import ParameterForm from "@/components/ParameterForm.vue";
import { emptyScenario, mockedMetadata, mockPinia, updatableNumericParameter } from "@/tests/unit/mocks/mockPinia";
import { mockNuxtImport, mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";

import { FetchError } from "ofetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

    const selectElements = component.findAll("select");
    expect(selectElements.length).toBe(2);

    selectElements.forEach((selectElement, index) => {
      const correctLabel = ["Drop Down", "Region"][index];
      const paramId = selectElement.element.attributes.getNamedItem("id")!.value;
      expect(component.find(`label[for=${paramId}]`).element.textContent).toBe(correctLabel);
      expect(selectElement.element.attributes.getNamedItem("aria-label")!.value).toBe(correctLabel);
    });

    expect(selectElements[0].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "1", label: "Option 1", selected: true },
      { value: "2", label: "Option 2", selected: false },
      { value: "3", label: "Option 3", selected: false },
      { value: "4", label: "Option 4", selected: false },
      { value: "5", label: "Option 5", selected: false },
      { value: "6", label: "Option 6", selected: false },
    ]);

    expect(selectElements[1].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "CLD", label: "Cloud Nine", selected: false },
      { value: "HVN", label: "Heaven", selected: true },
    ]);

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

  it("renders the current parameter values if the app store contains a current scenario", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { inModal: false },
      global: { stubs, plugins: [mockPinia({ currentScenario: scenarioWithParameters })] },
    });

    const selectElements = component.findAll("select");

    expect(selectElements[0].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "1", label: "Option 1", selected: false },
      { value: "2", label: "Option 2", selected: false },
      { value: "3", label: "Option 3", selected: true },
      { value: "4", label: "Option 4", selected: false },
      { value: "5", label: "Option 5", selected: false },
      { value: "6", label: "Option 6", selected: false },
    ]);

    expect(selectElements[1].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "CLD", label: "Cloud Nine", selected: true },
      { value: "HVN", label: "Heaven", selected: false },
    ]);

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

    const selectElement = component.find("select");
    await selectElement.setValue("2");
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

    const selectElement = component.find("select");
    const stockpileNumericInput = component.find("input[type='number'][id='mask_stockpile']");
    const stockpileRangeInput = component.find("input[type='range'][id='mask_stockpile']");

    expect(stockpileNumericInput.element.value).toBe("2");
    expect(stockpileRangeInput.element.value).toBe("2");
    expect(stockpileNumericInput.element.min).toBe("1");
    expect(stockpileNumericInput.element.max).toBe("3");

    await selectElement.setValue("4");
    await nextTick();

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
      global: { stubs, plugins: [mockPinia()] },
    });

    const buttonEl = component.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    expect(mockNavigateTo).toBeCalledWith("/scenarios/randomId");
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
});
