import { describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import AppHeader from "@/components/AppHeader.vue";

const stubs = {
  CIcon: true,
};

describe("app header", () => {
  it('emits "toggleSidebarVisibility" event when CHeaderToggler is clicked', async () => {
    const component = await mountSuspended(AppHeader, { global: { stubs } });

    await component.findComponent({ name: "CHeaderToggler" }).vm.$emit("click");
    expect(component.emitted()).toHaveProperty("toggleSidebarVisibility");
  });

  it("adds a scroll event listener on mount and removes it on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const component = await mountSuspended(AppHeader, { global: { stubs } });
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
});
