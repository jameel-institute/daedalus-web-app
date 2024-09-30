import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import type { VueWrapper } from "@vue/test-utils";
import { mockPinia } from "@/tests/unit/mocks/mockPinia";
import SideBar from "@/components/SideBar.vue";

const stubs = {
  CIcon: true,
};

const mockCSidebarPageloadBehavior = async (coreuiSidebar: VueWrapper) => {
  // The CoreUI Sidebar component will emit a "hide" event when the page loads.
  coreuiSidebar.vm.$emit("hide");
};

const mockedVersions = { daedalusModel: "1.2.3", daedalusApi: "4.5.6", daedalusWebApp: "7.8.9" };

describe("sidebar", () => {
  describe('when the "visible" prop is initialized as false', () => {
    describe("on smaller devices", () => {
      const plugins = [mockPinia({ largeScreen: false, versions: mockedVersions })];

      it('starts as hidden, and can be opened by setting "visible" prop', async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs, plugins },
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
          global: { stubs, plugins },
        });

        await waitFor(() => {
          const logoTitleAttribute = component.find(`[data-testid="logo"]`).attributes().title;
          expect(logoTitleAttribute).toContain("Model version: 1.2.3");
          expect(logoTitleAttribute).toContain("R API version: 4.5.6");
          expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
        });
      });
    });

    describe("on larger devices", () => {
      const plugins = [mockPinia({ largeScreen: true, versions: mockedVersions })];

      it("starts as shown", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs, plugins },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(coreuiSidebar.props("visible")).toBe(true);
        expect(coreuiSidebar.props("unfoldable")).toBe(true);
      });

      it("renders the text and href for nav items", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false },
          global: { stubs, plugins },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(component.text()).toContain("New scenario");
        const navLink = component.findComponent({ name: "NuxtLink" });
        expect(navLink.props("to")).toBe("/scenarios/new");
      });
    });
  });
});
