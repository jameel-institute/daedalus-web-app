import { CModal, CTooltip } from "@coreui/vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CodeSnippet from "~/components/CodeSnippet.vue";
import { emptyScenario, mockPinia } from "~/tests/unit/mocks/mockPinia";

describe("code snippet", () => {
  const stubs = {
    CIcon: true,
  };

  const render = async () => {
    return await mountSuspended(CodeSnippet, {
      global: { stubs, plugins: [mockPinia({
        currentScenario: { ...emptyScenario, parameters: { country: "THA" } },
      })] },
    });
  };

  it("renders as expected", async () => {
    const component = await render();
    expect(component.findComponent(CTooltip).props("content")).toBe("Generate code snippet");
    expect(component.find("button").attributes("aria-label")).toBe("Generate code snippet");
    expect(component.findComponent(CModal).props("visible")).toBe(false);
  });

  it("shows modal with expected snippet on button click");

  it("hides modal on close");

  it("copies snippet on Copy button click", () => {
    // TODO: and updates button text
  });

  it("resets Copied view on button blur");

  it("resets Copied view on button mouseleave");

  it("renders nothing if no parameters");
});
