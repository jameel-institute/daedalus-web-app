import ParameterHeader from "@/components/ParameterHeader.vue";
import ParameterIcon from "@/components/ParameterIcon.vue";
import TooltipHelp from "@/components/TooltipHelp.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("parameter header", () => {
  it("renders as expected", () => {
    const parameter = {
      id: "p1",
      label: "Parameter One",
      description: "some param",
    };
    const component = mount(ParameterHeader, {
      props: {
        parameter,
      },
    });
    expect(component.text()).toBe("Parameter One");
    expect(component.findComponent(ParameterIcon).props("parameter")).toStrictEqual(parameter);
    expect(component.find("label").attributes("for")).toBe("p1");
    expect(component.findComponent(TooltipHelp).props("helpText")).toBe("some param");
  });
});
