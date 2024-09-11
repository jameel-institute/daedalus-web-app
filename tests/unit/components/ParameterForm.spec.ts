import { describe, expect, it } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { FetchError } from "ofetch";
import { readBody } from "h3";
import { flushPromises } from "@vue/test-utils";
import { waitFor } from "@testing-library/vue";

import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import type { Metadata } from "@/types/apiResponseTypes";
import ParameterForm from "@/components/ParameterForm.vue";

const stubs = {
  CIcon: true,
};

const globeParameter = {
  id: "region",
  label: "Region",
  parameterType: "globeSelect",
  defaultOption: "HVN",
  ordered: false,
  options: [
    { id: "CLD", label: "Cloud Nine" },
    { id: "HVN", label: "Heaven" },
  ],
};

const selectParameters = [
  {
    id: "long_list",
    label: "Drop Down",
    parameterType: "select",
    defaultOption: null,
    ordered: false,
    options: [
      { id: "1", label: "Option 1" },
      { id: "2", label: "Option 2" },
      { id: "3", label: "Option 3" },
      { id: "4", label: "Option 4" },
      { id: "5", label: "Option 5" },
      { id: "6", label: "Option 6" },
    ],
  },
  {
    id: "short_list",
    label: "Radio Buttons",
    parameterType: "select",
    defaultOption: "no",
    ordered: false,
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },
];

const numericUpdatedFromParameter = {
  id: "population",
  label: "Population",
  parameterType: "numeric",
  ordered: false,
  step: 1000,
  updateNumericFrom: {
    parameterId: "short_list",
    values: {
      yes: {
        min: 11000,
        default: 17000,
        max: 50000,
      },
      no: {
        min: 1000,
        default: 2000,
        max: 4000,
      },
    },
  },
};

const metadata = { modelVersion: "0.0.0", parameters: [...selectParameters, globeParameter, numericUpdatedFromParameter] } as Metadata;

describe("parameter form", () => {
  it("renders the correct parameter labels, inputs, options, and default values", async () => {
    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata,
          metadataFetchStatus: "success",
        })],
      },
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
  });

  it("updates the numeric input's min, max, and default values based on the selected option", async () => {
    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata,
          metadataFetchStatus: "success",
        })],
      },
    });

    const shortList = component.findComponent({ name: "CButtonGroup" });

    const numericInput = component.find("input[type='number']");
    expect(numericInput.element.value).toBe("2000");

    await shortList.find("input[value='yes']").setChecked();
    expect(numericInput.element.value).toBe("17000");

    await shortList.find("input[value='no']").setChecked();
    expect(numericInput.element.value).toBe("2000");
  });

  it("displays feedback when the form is submitted with invalid values", async () => {
    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata,
          metadataFetchStatus: "success",
        })],
      },
    });

    const numericInput = component.find("input[type='number']");
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
        const { parameters } = await readBody(event);

        if (parameters.long_list === "1" && parameters.region === "HVN" && parameters.short_list === "no") {
          return { runId: "randomId" };
        } else {
          return { error: "Test failed due to wrong parameters" };
        }
      },
    });

    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata,
          metadataFetchStatus: "success",
        })],
      },
    });

    const buttonEl = component.find("button[type='submit']");
    expect(buttonEl.attributes("disabled")).not.toBe("");
    await buttonEl.trigger("click");
    expect(buttonEl.attributes("disabled")).toBe("");

    await flushPromises();
    // I couldn't find a way to spy on the navigateTo function, so this is a second-best test that we
    // at least construct the correct path to navigate to.
    const cForm = component.findComponent({ name: "CForm" });
    await waitFor(() => {
      expect(
        cForm.element.attributes.getNamedItem("data-test-navigate-to")!.value,
      ).toBe("/scenarios/randomId");
    });
  });

  it("displays CAlert with error message when metadataFetchStatus is 'error'", async () => {
    const error = new FetchError("There was a bee-related issue.");

    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata: undefined,
          metadataFetchStatus: "error",
          metadataFetchError: error,
        })],
      },
    });

    expect(component.findComponent({ name: "CAlert" }).exists()).toBe(true);
    expect(component.text()).toContain("Failed to initialise.");
    expect(component.text()).toContain("There was a bee-related issue.");
  });

  it("displays CSpinner when metadataFetchStatus is 'pending'", async () => {
    const component = await mountSuspended(ParameterForm, {
      global: {
        stubs,
        plugins: [mockPinia({
          metadata: undefined,
          metadataFetchStatus: "pending",
        })],
      },
    });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);
  });
});
