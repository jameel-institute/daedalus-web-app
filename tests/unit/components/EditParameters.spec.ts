import EditParameters from "@/components/EditParameters.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

const stubs = {
  CIcon: true,
};

describe("edit parameters", () => {
  describe('when the "modalVisible" state is false', () => {
    it("does not show the modal initially, and can open and close it", async () => {
      const component = await mountSuspended(EditParameters, {
        global: { stubs },
      });
      expect(component.findComponent({ name: "CModal" }).props("visible")).toBe(false);
      await component.findComponent({ name: "CButton" }).trigger("click");
      await nextTick();
      expect(component.findComponent({ name: "CModal" }).props("visible")).toBe(true);
      await component.findComponent({ name: "CModal" }).vm.$emit("close");
      await nextTick();
      expect(component.findComponent({ name: "CModal" }).props("visible")).toBe(false);
    });
  });
});
