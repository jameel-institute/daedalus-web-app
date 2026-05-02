import RotateAlert from "@/components/RotateAlert.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const stubs = {
  CAlert: {
    template: "<div><slot /></div>",
  },
  CIconSvg: {
    template: "<div><slot /></div>",
  },
};

describe("rotate alert", () => {
  let isPortrait = false;

  beforeEach(() => {
    isPortrait = false;
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => {
      return {
        matches: query === "(orientation: portrait)" ? isPortrait : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the alert when the device is in portrait orientation", async () => {
    isPortrait = true;

    const component = await mountSuspended(RotateAlert, { global: { stubs } });

    expect(component.text()).toContain("Rotate your device to landscape for the best experience.");
  });

  it("updates the alert visibility when the window is resized", async () => {
    const component = await mountSuspended(RotateAlert, { global: { stubs } });

    expect(component.text()).not.toContain("Rotate your device to landscape for the best experience.");

    isPortrait = true;
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(250);
    await nextTick();

    expect(component.text()).toContain("Rotate your device to landscape for the best experience.");

    isPortrait = false;
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(250);
    await nextTick();

    expect(component.text()).not.toContain("Rotate your device to landscape for the best experience.");
  });
});
