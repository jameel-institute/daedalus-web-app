import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { FetchError } from "ofetch";

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

const metaData = { modelVersion: "0.0.0", parameters: [...selectParameters, globeParameter] };

describe("parameter form", () => {
  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(ParameterForm, {
      props: { globeParameter: undefined, metaData: undefined, metadataFetchStatus: "pending", metadataFetchError: null },
      global: { stubs },
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("renders the correct parameter labels, inputs, options, and default values", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { globeParameter, metaData, metadataFetchStatus: "success", metadataFetchError: null },
      global: { stubs },
    });

    expect(component.text()).toContain("Region");
    expect(component.text()).toContain("Drop Down");
    expect(component.text()).toContain("Radio Buttons");

    const selectComponents = component.findAllComponents({ name: "CFormSelect" });
    expect(selectComponents.length).toBe(2);

    expect(selectComponents[0].find("label").text()).toBe("Drop Down");
    expect(selectComponents[0].find("select").element.attributes.getNamedItem("aria-label")!.value).toBe("Drop Down");
    expect(selectComponents[0].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "1", label: "Option 1", selected: true },
      { value: "2", label: "Option 2", selected: false },
      { value: "3", label: "Option 3", selected: false },
      { value: "4", label: "Option 4", selected: false },
      { value: "5", label: "Option 5", selected: false },
      { value: "6", label: "Option 6", selected: false },
    ]);

    expect(selectComponents[1].find("label").text()).toBe("Region");
    expect(selectComponents[1].find("select").element.attributes.getNamedItem("aria-label")!.value).toBe("Region");
    expect(selectComponents[1].findAll("option").map((option) => {
      return { value: option.element.value, label: option.text(), selected: option.element.selected };
    })).toEqual([
      { value: "CLD", label: "Cloud Nine", selected: false },
      { value: "HVN", label: "Heaven", selected: true },
    ]);

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

  it("initialises formData with defaults and updates formData when a parameter is changed", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { globeParameter, metaData, metadataFetchStatus: "success", metadataFetchError: null },
      global: { stubs },
    });

    const cForm = component.findComponent({ name: "CForm" });
    let formData = JSON.parse(cForm.element.attributes.getNamedItem("data-test")!.value);
    expect(formData.region).toBe("HVN");
    expect(formData.long_list).toBe("1");
    expect(formData.short_list).toBe("no");

    const selectComponents = component.findAllComponents({ name: "CFormSelect" });
    const longListDropDown = selectComponents[0];
    expect(longListDropDown.find("label").text()).toBe("Drop Down");
    const countrySelect = selectComponents[1];
    expect(countrySelect.find("label").text()).toBe("Region");

    await longListDropDown.find("select").findAll("option").at(2)!.setSelected();
    await countrySelect.find("select").findAll("option").at(0)!.setSelected();
    await component.findComponent({ name: "CButtonGroup" }).find("input[value='yes']").setChecked();

    formData = JSON.parse(cForm.element.attributes.getNamedItem("data-test")!.value);
    expect(formData.region).toBe("CLD");
    expect(formData.long_list).toBe("3");
    expect(formData.short_list).toBe("yes");
  });

  it("displays CAlert with error message when metadataFetchStatus is 'error'", async () => {
    const error = new FetchError("There was a bee-related issue.");

    const component = await mountSuspended(ParameterForm, {
      props: { globeParameter: undefined, metaData: undefined, metadataFetchStatus: "error", metadataFetchError: error },
      global: { stubs },
    });

    expect(component.findComponent({ name: "CAlert" }).exists()).toBe(true);
    expect(component.text()).toContain("Failed to retrieve metadata from R API.");
    expect(component.text()).toContain("There was a bee-related issue.");
  });

  it("displays CSpinner when metadataFetchStatus is 'pending'", async () => {
    const component = await mountSuspended(ParameterForm, {
      props: { globeParameter: undefined, metaData: undefined, metadataFetchStatus: "pending", metadataFetchError: null },
      global: { stubs },
    });

    expect(component.findComponent({ name: "CSpinner" }).exists()).toBe(true);
  });
});
