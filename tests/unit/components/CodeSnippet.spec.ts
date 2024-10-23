import { CTooltip } from "@coreui/vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ParameterForm from "~/components/ParameterForm.vue";
import { mockPinia } from "~/tests/unit/mocks/mockPinia";

describe("code snippet", () => {
  const stubs = {
    CIcon: true,
  };

  const renderComponent = async () => {
    return await mountSuspended(ParameterForm, {
      global: { stubs, plugins: [mockPinia()] },
    });
  };

  it("renders as expected", () => {
    const component = renderComponent();
    expect(component.findComponent(CTooltip));
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
