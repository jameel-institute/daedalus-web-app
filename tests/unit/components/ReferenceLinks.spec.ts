import ReferenceLinks from "@/components/ReferenceLinks.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

describe("referenceLinks.vue", () => {
  it("renders correctly", async () => {
    const component = await mountSuspended(ReferenceLinks);
    expect(component.text()).toContain("For full details on the underlying DAEDALUS model, visit");
  });

  it("applies customClasses prop correctly", async () => {
    const customClasses = "custom-class";
    const component = await mountSuspended(ReferenceLinks, {
      props: { customClasses },
    });
    expect(component.find("p").classes()).toContain("custom-class");
  });
});
