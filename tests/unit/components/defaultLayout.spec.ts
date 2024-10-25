import DefaultLayout from "@/layouts/default.vue";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";

const stubs = {
  CIcon: true,
  Globe: true,
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

  it("should render JI logo on sidebar and header", async () => {
    const component = await mountSuspended(DefaultLayout, { global: { stubs } });

    const headerLogo = component.find(`[data-testid="ji-logo-header"]`);
    const sidebarLogo = component.find(`[data-testid="ji-logo-sidebar"]`);

    expect(headerLogo.isVisible()).toBe(true);
    expect(sidebarLogo.isVisible()).toBe(true);
    await waitFor(() => {
      expect(headerLogo.attributes().title).toContain("Model version: 1.2.3");
      expect(headerLogo.attributes().title).toContain("R API version: 4.5.6");
      expect(headerLogo.attributes().title).toContain("Web app version: 7.8.9");
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
