// @vitest-environment nuxt

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { VueWrapper } from "@vue/test-utils";
import SideBar from "@/components/SideBar.vue";

const stubs = {
  CIcon: true,
};

async function mockCSidebarPageloadBehavior(coreuiSidebar: VueWrapper) {
  // The CoreUI Sidebar component will emit a "hide" event when the page loads.
  coreuiSidebar.vm.$emit("hide");
}

describe("sidebar", () => {
  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(SideBar, { global: { stubs } });
    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('when the "visible" prop is initialized as false', () => {
    describe("on smaller devices", () => {
      beforeAll(() => {
        vi.stubGlobal("innerWidth", 500);
      });

      it('starts as hidden, and can be opened by setting "visible" prop', async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(coreuiSidebar.props("visible")).toBe(false);
        expect(coreuiSidebar.props("unfoldable")).toBe(false);

        await component.setProps({ visible: true });

        expect(coreuiSidebar.props("visible")).toBe(true);
        expect(coreuiSidebar.props("unfoldable")).toBe(false);
      });

      afterAll(() => {
        vi.unstubAllGlobals();
      });
    });

    describe("on larger devices", () => {
      beforeAll(() => {
        vi.stubGlobal("innerWidth", 1500);
      });

      it("starts as shown", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(coreuiSidebar.props("visible")).toBe(true);
        expect(coreuiSidebar.props("unfoldable")).toBe(true);
      });

      it("renders the text and href for nav items", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(component.text()).toContain("New scenario");
        const navLink = component.findComponent({ name: "CNavLink" });
        expect(navLink.props("href")).toBe("/scenarios/new");
      });

      afterAll(() => {
        vi.unstubAllGlobals();
      });
    });
  });
});
