import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";

import DefaultLayout from "@/layouts/default.vue";

const stubs = {
  CIcon: true,
};

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
