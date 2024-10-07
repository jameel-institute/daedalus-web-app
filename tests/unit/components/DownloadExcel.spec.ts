import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { AppState } from "~/types/storeTypes";
import { CAlert, CButton, CSpinner, CTooltip, DownloadExcel } from "#components";
import { mockPinia } from "~/tests/unit/mocks/mockPinia";

const stubs = {
  CIcon: true,
};

describe("download Excel", () => {
  const render = (appState: Partial<AppState>) => {
    return mount(DownloadExcel, {
      global: {
        stubs,
        plugins: [mockPinia({
          ...appState,
        })],
      },
    });
  };

  it("renders nothing if no scenario parameters", () => {
    const component = render({});
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.findComponent(CButton).exists()).toBe(false);
    expect(component.findComponent(CSpinner).exists()).toBe(false);
    expect(component.findComponent(CAlert).exists()).toBe(false);
  });

  it("renders download button when not downloading", () => {
    const component = render({
      currentScenario: { parameters: {} } as any,
    });
    expect(component.findComponent(CTooltip).props("content")).toBe("Download as Excel file");
    expect(component.findComponent(CButton).exists()).toBe(true);
    expect(component.findComponent(CSpinner).exists()).toBe(false);
    expect(component.findComponent(CAlert).props("visible")).toBe(false);
  });

  it("renders spinner when downloading", () => {
    const component = render({
      currentScenario: { parameters: {} } as any,
      downloading: true,
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.findComponent(CButton).exists()).toBe(false);
    expect(component.findComponent(CSpinner).props("size")).toBe("sm");
    expect(component.findComponent(CAlert).props("visible")).toBe(false);
  });

  it("clicking download button invokes download action", async () => {
    const component = render({
      currentScenario: { parameters: {} } as any,
    });
    const downloadButton = component.findComponent(CTooltip).findComponent(CButton);
    await downloadButton.trigger("click");
    const store = (component.vm as any).appStore;
    expect(store.downloadExcel).toHaveBeenCalledTimes(1);
  });

  it("shows alert when there is a download error", () => {
    const component = render({
      currentScenario: { parameters: {} } as any,
      downloadError: "test error",
    });
    expect(component.findComponent(CTooltip).exists()).toBe(true);
    expect(component.findComponent(CSpinner).exists()).toBe(false);
    const alert = component.findComponent(CAlert);
    expect(alert.props("visible")).toBe(true);
    expect(alert.props("color")).toBe("danger");
    expect(alert.text()).toBe("Download error: test error");
  });

  it("alert can be dismissed, and re-shown on new download", async () => {
    const component = render({
      currentScenario: { parameters: {} } as any,
      downloadError: "test error",
    });
    const alert = component.findComponent(CAlert);
    const close = alert.findComponent(CButton);
    await close.trigger("click");
    expect(alert.props("visible")).toBe(false);

    // trigger downloading watch
    const store = (component.vm as any).appStore;
    store.downloading = true;
    store.downloadError = "new error";
    await nextTick();
    expect(alert.props("visible")).toBe(true);
    expect(alert.text()).toBe("Download error: new error");
  });
});
