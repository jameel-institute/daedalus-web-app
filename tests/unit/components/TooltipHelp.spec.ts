import TooltipHelp from "@/components/TooltipHelp.vue";
import { CTooltip } from "@coreui/vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("tooltip help", () => {
  it("renders as expected", () => {
    const component = mount(TooltipHelp, {
      props: {
        helpText: "some help text",
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).props("content")).toBe("some help text");
    const img = component.find("img");
    expect(img.classes().includes("class-1")).toBe(true);
    expect(img.classes().includes("class-2")).toBe(true);
    expect(img.attributes("src")).toBe("/assets/icons/circleQuestion.svg");
  });

  it("renders nothing when no help text", () => {
    const component = mount(TooltipHelp, {
      props: {
        helpText: undefined,
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("img").exists()).toBe(false);
  });
});
