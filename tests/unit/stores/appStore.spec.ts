import { beforeEach, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { useAppStore } from "@/stores/appStore";

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  registerEndpoint("/api/versions", () => {
    return {
      daedalusModel: "1.2.3",
      daedalusApi: "4.5.6",
      daedalusWebApp: "7.8.9",
    };
  });

  describe("actions", () => {
    it("initialises correctly", async () => {
      const store = useAppStore();
      expect(store.largeScreen).toBe(true);
      expect(store.versions).toBeUndefined();
      store.initializeAppState();

      expect(store.largeScreen).toBe(true);
      await waitFor(() => {
        expect(store.versions).toEqual({
          daedalusModel: "1.2.3",
          daedalusApi: "4.5.6",
          daedalusWebApp: "7.8.9",
        });
      });
    });
  });
});
