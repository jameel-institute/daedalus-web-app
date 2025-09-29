import { CAlert, CButton, CTooltip, DownloadExcel } from "#components";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { mockPinia } from "~/tests/unit/mocks/mockPinia";
import type { AppState } from "~/types/storeTypes";

const stubs = {
  CIcon: true,
};

const minimalScenario = {
  parameters: {},
  result: {
    data: {},
  },
} as any;

describe("download Excel", () => {
  const render = (appState: Partial<AppState>, comparison = false) => {
    return mount(DownloadExcel, {
      props: { comparison },
      global: {
        stubs,
        plugins: [mockPinia({
          ...appState,
        })],
      },
    });
  };

  it("renders nothing if not comparison and no scenario parameters", () => {
    const component = render(
      {
        currentScenario: {
          result: {
            data: { },
          },
        } as any,
      },
    );
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.findComponent(CButton).exists()).toBe(false);
    expect(component.findComponent(CAlert).exists()).toBe(false);
  });

  it("renders nothing if not comparison and no result data", () => {
    const component = render({
      currentScenario: {
        parameters: {},
        result: {
          data: undefined,
        },
      } as any,
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.findComponent(CButton).exists()).toBe(false);
    expect(component.findComponent(CAlert).exists()).toBe(false);
  });

  it("renders nothing if comparison and not every scenario has run successfully", () => {
    const component = render({
      currentComparison: {
        scenarios: [
          { runId: "abc", status: { data: { runSuccess: false } } },
          { runID: "def", status: { data: { runSuccess: true } } },
        ],
      } as any,
    }, true);
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.findComponent(CButton).exists()).toBe(false);
    expect(component.findComponent(CAlert).exists()).toBe(false);
  });

  it("download button is enabled when not downloading", () => {
    const component = render({
      currentScenario: minimalScenario,
    });
    expect(component.findComponent(CTooltip).isVisible()).toBe(true);
    expect(component.findComponent(CTooltip).props("content")).toBe("Download as Excel file");
    expect(component.findComponent(CButton).isVisible()).toBe(true);
    expect(component.findComponent(CButton).props("disabled")).toBe(false);
    expect(component.findComponent(CAlert).props("visible")).toBe(false);
  });

  it("download button is disabled when not downloading", () => {
    const component = render({
      currentScenario: minimalScenario,
      downloading: true,
    });
    expect(component.findComponent(CButton).isVisible()).toBe(true);
    expect(component.findComponent(CButton).props("disabled")).toBe(true);
    expect(component.findComponent(CAlert).props("visible")).toBe(false);
  });

  it("clicking download button invokes download action", async () => {
    const component = render({
      currentScenario: minimalScenario,
    });
    const downloadButton = component.findComponent(CTooltip).findComponent(CButton);
    await downloadButton.trigger("click");
    const store = (component.vm as any).appStore;
    expect(store.downloadExcel).toHaveBeenCalledWith(false);
  });

  it("click download button passes true comparison prop to download action", async () => {
    const component = render({
      currentComparison: {
        scenarios: [
          { runId: "abc", status: { data: { runSuccess: true } } },
          { runID: "def", status: { data: { runSuccess: true } } },
        ],
      } as any,
    } as any, true);
    const downloadButton = component.findComponent(CTooltip).findComponent(CButton);
    await downloadButton.trigger("click");
    const store = (component.vm as any).appStore;
    expect(store.downloadExcel).toHaveBeenCalledWith(true);
  });

  it("shows alert when there is a download error", () => {
    const component = render({
      currentScenario: minimalScenario,
      downloadError: "test error",
    });
    expect(component.findComponent(CTooltip).exists()).toBe(true);
    const alert = component.findComponent(CAlert);
    expect(alert.props("visible")).toBe(true);
    expect(alert.props("color")).toBe("danger");
    expect(alert.text()).toBe("Download error: test error");
  });

  it("alert can be dismissed, and re-shown on new download", async () => {
    const component = render({
      currentScenario: minimalScenario,
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
