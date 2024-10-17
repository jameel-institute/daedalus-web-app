import About from "@/pages/about.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

describe("about page", () => {
  it("should render about page", async () => {
    const component = await mountSuspended(About);

    expect(component.text()).toContain("About");
  });
});
