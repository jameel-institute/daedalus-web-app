import AppHeader from "@/components/AppHeader.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { waitFor } from "@testing-library/vue";
import { mockVersions } from "../mocks/mockPinia";

const stubs = {
  CIcon: true,
};

const versionTooltipContent = `Model version: ${mockVersions.daedalusModel} \nR API version: ${mockVersions.daedalusApi} \nWeb app version: ${mockVersions.daedalusWebApp}`;

describe("app header", () => {
  it('emits "toggleSidebarVisibility" event when CHeaderToggler is clicked', async () => {
    const component = await mountSuspended(AppHeader, { global: { stubs }, props: { versionTooltipContent } });

    await component.findComponent({ name: "CHeaderToggler" }).vm.$emit("click");
    expect(component.emitted()).toHaveProperty("toggleSidebarVisibility");
  });

  it("adds a scroll event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(AppHeader, { global: { stubs }, props: { versionTooltipContent } });
    expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    const header = component.findComponent({ name: "CHeader" });
    expect(header.element.classList).not.toContain("shadow-sm");

    document.documentElement.scrollTop = 100;
    window.dispatchEvent(new Event("scroll"));
    // Allow time for throttle to happen
    await component.vm.$nextTick();

    expect(header.element.classList).toContain("shadow-sm");

    // Reset global value for other tests
    document.documentElement.scrollTop = 0;

    component.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("should render logo and include information about the version numbers", async () => {
    const component = await mountSuspended(AppHeader, {
      props: { versionTooltipContent },
      global: { stubs },
    });

    await waitFor(() => {
      const logoTitleAttribute = component
        .find(`[data-testid="ji-logo-header"]`)
        .attributes()
        .title;
      expect(logoTitleAttribute).toContain("Model version: 1.2.3");
      expect(logoTitleAttribute).toContain("R API version: 4.5.6");
      expect(logoTitleAttribute).toContain("Web app version: 7.8.9");
    });
  });
});
