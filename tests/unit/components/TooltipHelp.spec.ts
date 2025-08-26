import TooltipHelp from "@/components/TooltipHelp.vue";
import { CTooltip } from "@coreui/vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

let originalBodyInnerHTML: string;
describe("tooltip help", () => {
  beforeEach(() => {
    originalBodyInnerHTML = document.body.innerHTML;
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyInnerHTML;
    vi.useRealTimers();
  });

  it("renders as expected when the help text is a string", async () => {
    const component = mount(TooltipHelp, {
      props: {
        helpText: "some help text",
        classes: ["class-1", "class-2"],
      },
    });
    expect(document.body.textContent).not.toContain("some help text");

    await component.find("img").trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();

    expect(document.body.innerHTML).toContain("some help text");

    const img = component.find("img");
    expect(img.classes().includes("class-1")).toBe(true);
    expect(img.classes().includes("class-2")).toBe(true);
    expect(img.attributes("src")).toBe("/icons/circleQuestion.svg");
  });

  it("renders as expected when the help text is a list of strings", async () => {
    const component = mount(TooltipHelp, {
      props: {
        helpText: undefined,
        listHeader: "Get ready to read an unordered list",
        listItems: ["some help text", "on separate lines"],
        classes: ["class-1", "class-2"],
        infoIcon: true,
      },
    });
    expect(document.body.textContent).not.toContain("some help text");

    await component.find("img").trigger("focus");
    vi.advanceTimersByTime(1);
    await nextTick();

    expect(document.body.innerHTML).toContain(`Get ready to read an unordered list `
      + `<ul>`
      + `<li>some help text</li>`
      + `<li>on separate lines</li>`
      + `</ul>`);

    const img = component.find("img");
    expect(img.classes().includes("class-1")).toBe(true);
    expect(img.classes().includes("class-2")).toBe(true);

    expect(component.find("img").attributes("src")).toBe("/icons/info.png");
  });

  it("renders nothing when no help text or list props", () => {
    const component = mount(TooltipHelp, {
      props: {
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("img").exists()).toBe(false);
  });

  it("renders nothing when both help text and list props", () => {
    const component = mount(TooltipHelp, {
      props: {
        helpText: "some help text",
        listHeader: "Get ready to read an unordered list",
        listItems: ["some help text", "on separate lines"],
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("img").exists()).toBe(false);
  });

  it("renders nothing when only list header prop provided", () => {
    const component = mount(TooltipHelp, {
      props: {
        listHeader: "Get ready to read an unordered list",
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("img").exists()).toBe(false);
  });

  it("renders nothing when only list items prop provided", () => {
    const component = mount(TooltipHelp, {
      props: {
        listItems: ["some help text", "on separate lines"],
        classes: ["class-1", "class-2"],
      },
    });
    expect(component.findComponent(CTooltip).exists()).toBe(false);
    expect(component.find("img").exists()).toBe(false);
  });
});
