import About from "@/pages/about.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("about page", () => {
  it("should render about page", () => {
    const component = mount(About);

    expect(component.text()).toContain("About");
  });
});
