import { CModal, CTooltip } from "@coreui/vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CodeSnippet from "~/components/CodeSnippet.vue";
import { emptyScenario, mockPinia } from "~/tests/unit/mocks/mockPinia";

const stubs = {
  CIcon: true,
};

const parameters = {
  country: "THA",
  pathogen: "influenza_1918",
  response: "none",
  hospital_capacity: "5500",
  vaccine: "high",
};

const expectedSnippet = `model_result <- daedalus::daedalus(
  "THA",
  "influenza_1918",
  response_strategy = "none",
  response_threshold = 5500,
  vaccine_investment = "high"
)`;

const mockCopyToClipboard = vi.fn();
const originalNavigator = { ...globalThis.navigator };

describe("code snippet", () => {
  const render = async () => {
    return await mountSuspended(CodeSnippet, {
      global: { stubs, plugins: [mockPinia({
        currentScenario: { ...emptyScenario, parameters },
      })] },
    });
  };

  beforeEach(() => {
    globalThis.navigator = {
      clipboard: {
        writeText: mockCopyToClipboard,
      },
    } as any;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    globalThis.navigator = originalNavigator;
    vi.useRealTimers();
  });

  it("renders as expected", async () => {
    const component = await render();
    expect(component.findComponent(CTooltip).props("content")).toBe("Generate code snippet");
    expect(component.find("button.btn-scenario-header").attributes("aria-label")).toBe("Generate code snippet");
    expect(component.findComponent(CModal).props("visible")).toBe(false);
  });

  it("shows modal with expected snippet on button click", async () => {
    const component = await render();
    await component.find("button.btn-scenario-header").trigger("click");
    expect(component.findComponent(CModal).props("visible")).toBe(true);
    expect(component.find("a").attributes("href")).toBe("https://jameel-institute.github.io/daedalus/");

    expect(component.find("pre").text()).toBe(expectedSnippet);
  });

  it("copies snippet on Copy button click", async () => {
    const component = await render();
    await component.find("button.btn-scenario-header").trigger("click");
    const copyBtn = component.find("#btn-copy-code");
    expect(copyBtn.text()).toBe("Copy");
    await copyBtn.trigger("click");
    expect(mockCopyToClipboard).toHaveBeenCalledWith(expectedSnippet);
    expect(copyBtn.text()).toBe("Copied!");
  });

  const expectCopyTextResetAfterDelay = async (event: string) => {
    const component = await render();
    await component.find("button.btn-scenario-header").trigger("click");
    const copyBtn = component.find("#btn-copy-code");
    await copyBtn.trigger("click");
    await copyBtn.trigger(event);
    // Text should not reset immediately..
    expect(copyBtn.text()).toBe("Copied!");
    // ..but after a delay
    vi.advanceTimersByTime(1500);
    await nextTick();
    expect(copyBtn.text()).toBe("Copy");
  };

  it("resets Copied text on button blur, after delay", async () => {
    await expectCopyTextResetAfterDelay("blur");
  });

  it("resets Copied view on button mouseleave, after delay", async () => {
    await expectCopyTextResetAfterDelay("mouseleave");
  });

  it("renders nothing if no parameters", async () => {
    const component = await mountSuspended(CodeSnippet, {
      global: { stubs, plugins: [mockPinia({
        currentScenario: { ...emptyScenario },
      })] },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("button").exists()).toBe(false);
    expect(component.findComponent(CModal).exists()).toBe(false);
  });
});
