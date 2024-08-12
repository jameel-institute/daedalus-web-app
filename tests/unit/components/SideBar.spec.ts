import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import type { VueWrapper } from "@vue/test-utils";

import SideBar from "@/components/SideBar.vue";

const stubs = {
  CIcon: true,
};

const mockCSidebarPageloadBehavior = async (coreuiSidebar: VueWrapper) => {
  // The CoreUI Sidebar component will emit a "hide" event when the page loads.
  coreuiSidebar.vm.$emit("hide");
};

describe("sidebar", () => {
  registerEndpoint("/api/versions", () => {
    return {
      daedalusModel: "1.2.3",
      daedalusApi: "4.5.6",
      daedalusWebApp: "7.8.9",
    };
  });

  it("adds a resize event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(SideBar, {
      props: { visible: false },
      global: { stubs },
    });
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

      it("includes information about the version numbers", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs },
        });

        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        await component.setProps({ visible: true });

        await waitFor(() => {
          const logoTitleAttribute = component.find(`[data-testid="logo"]`).attributes().title;
          expect(logoTitleAttribute).toContain("Model version: 1.2.3");
          expect(logoTitleAttribute).toContain("R API version: 4.5.6");
          expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
        });
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
        expect(navLink.props("href")).toBe("/scenario/new");
      });

      afterAll(() => {
        vi.unstubAllGlobals();
      });
    });
  });
});
