import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import DefaultLayout from "@/layouts/default.vue";

const stubs = {
  CIcon: true,
};

registerEndpoint("/api/versions", () => {
  return {
    daedalusModel: "1.2.3",
    daedalusApi: "4.5.6",
    daedalusWebApp: "7.8.9",
  };
});

describe("default layout", () => {
  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(DefaultLayout, { global: { stubs } });
    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("includes information about the version numbers", async () => {
    const component = await mountSuspended(DefaultLayout, { global: { stubs } });

    await waitFor(() => {
      const logoTitleAttribute = component.find(`[data-testid="logo"]`).attributes().title;
      expect(logoTitleAttribute).toContain("Model version: 1.2.3");
      expect(logoTitleAttribute).toContain("R API version: 4.5.6");
      expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
    });
  });

  describe("on smaller devices", () => {
    beforeAll(() => {
      vi.stubGlobal("innerWidth", 500);
    });

    it("can open the sidebar from the app header", async () => {
      const component = await mountSuspended(DefaultLayout, { global: { stubs } });

      const sidebar = component.findComponent({ name: "SideBar" });
      expect(sidebar.props("visible")).toBe(false);

      const header = component.findComponent({ name: "AppHeader" });
      await header.vm.$emit("toggleSidebarVisibility");
      expect(sidebar.props("visible")).toBe(true);
    });

    afterAll(() => {
      vi.unstubAllGlobals();
    });
  });
});
