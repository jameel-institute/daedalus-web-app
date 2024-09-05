import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppStore } from "@/stores/appStore";

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("actions", () => {
    it("initialises correctly", async () => {
      const store = useAppStore();
      expect(store.largeScreen).toBe(true);
      store.initializeAppState();
      expect(store.largeScreen).toBe(true);
    });

    it("can update and retrieve the screen size", async () => {
      const store = useAppStore();
      const { screenIsLarge } = storeToRefs(store);

      store.setScreenSize(false);
      expect(screenIsLarge.value).toBe(false);
    });
  });
});
