import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";

import DefaultLayout from "@/layouts/default.vue";

const stubs = {
  CIcon: true,
};

describe("default layout", () => {
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
