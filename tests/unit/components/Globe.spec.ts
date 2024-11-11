import Globe from "@/components/Globe.vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

describe("globe", () => {
  it("asdf", async () => {
    const component = await mountSuspended(Globe);

    console.error(component.html());
  });
});
