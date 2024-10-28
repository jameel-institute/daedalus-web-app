import type { VueWrapper } from "@vue/test-utils";
import SideBar from "@/components/SideBar.vue";
import { mockPinia, mockVersions } from "@/tests/unit/mocks/mockPinia";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";

const stubs = {
  CIcon: true,
};

const mockCSidebarPageloadBehavior = async (coreuiSidebar: VueWrapper) => {
  // The CoreUI Sidebar component will emit a "hide" event when the page loads.
  coreuiSidebar.vm.$emit("hide");
};

const versionTooltipContent = `Model version: ${mockVersions.daedalusModel} \nR API version: ${mockVersions.daedalusApi} \nWeb app version: ${mockVersions.daedalusWebApp}`;
describe("sidebar", () => {
  describe('when the "visible" prop is initialized as false', () => {
    describe("on smaller devices", () => {
      const plugins = [
        mockPinia({ largeScreen: false }),
      ];

      it('starts as hidden, and can be opened by setting "visible" prop', async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false, versionTooltipContent },
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

      it("should render logo and include information about the version numbers", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false, versionTooltipContent },
          global: { stubs, plugins },
        });

        await waitFor(() => {
          const logoTitleAttribute = component
            .find(`[data-testid="ji-logo-sidebar"]`)
            .attributes()
            .title;
          expect(logoTitleAttribute).toContain("Model version: 1.2.3");
          expect(logoTitleAttribute).toContain("R API version: 4.5.6");
          expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
        });
      });
    });

    describe("on larger devices", () => {
      const plugins = [
        mockPinia({ largeScreen: true }),
      ];

      it("starts as shown", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false, versionTooltipContent },
          global: { stubs, plugins },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        expect(coreuiSidebar.props("visible")).toBe(true);
        expect(coreuiSidebar.props("unfoldable")).toBe(true);
      });

      it("renders the text and href for nav items", async () => {
        const component = await mountSuspended(SideBar, {
          props: { visible: false, versionTooltipContent },
          global: { stubs, plugins },
        });
        const coreuiSidebar = component.findComponent({ name: "CSidebar" });
        await mockCSidebarPageloadBehavior(coreuiSidebar);

        const text = component.text();
        expect(text).toContain("New scenario");
        expect(text).toContain("About");
        const navLinks = component.findAllComponents({ name: "NuxtLink" });
        expect(navLinks[0].props("to")).toBe("/scenarios/new");
        expect(navLinks[1].props("to")).toBe("/about");
        expect(navLinks[2].props("to")).toBe("https://github.com/jameel-institute/daedalus");
      });
    });
  });
});
