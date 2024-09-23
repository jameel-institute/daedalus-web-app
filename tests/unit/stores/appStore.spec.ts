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

  registerEndpoint("/api/metadata", () => {
    return {
      parameters: [
        { id: "country", parameterType: "globeSelect" },
        { id: "settings", parameterType: "select" },
      ],
      results: {
        costs: [
          { id: "total", label: "Total" },
        ],
      },
      modelVersion: "1.2.3",
    };
  });

  describe("actions", () => {
    it("initialises correctly", async () => {
      const store = useAppStore();
      expect(store.versions).toBeUndefined();
      expect(store.metadata).toBeUndefined();
      expect(store.largeScreen).toBe(true);
    });

    it("can retrieve the version numbers", async () => {
      const store = useAppStore();
      store.loadVersionData();

      await waitFor(() => {
        expect(store.versions).toEqual({
          daedalusModel: "1.2.3",
          daedalusApi: "4.5.6",
          daedalusWebApp: "7.8.9",
        });
      });
    });

    it("can retrieve the metadata", async () => {
      const store = useAppStore();
      await store.loadMetadata();

      await waitFor(() => {
        expect(store.metadata).toEqual({
          parameters: [
            { id: "country", parameterType: "globeSelect" },
            { id: "settings", parameterType: "select" },
          ],
          results: {
            costs: [
              { id: "total", label: "Total" },
            ],
          },
          modelVersion: "1.2.3",
        });
      });
      expect(store.metadataFetchStatus).toBe("success");
    });

    it("can get the globe parameter", async () => {
      const store = useAppStore();
      await store.loadMetadata();

      await waitFor(() => {
        expect(store.globeParameter).toEqual({ id: "country", parameterType: "globeSelect" });
      });
    });

    it("can clear the current scenario", async () => {
      const store = useAppStore();
      store.currentScenario = {
        runId: "123",
        parameters: { country: "USA" },
        result: {
          data: { costs: { id: "deaths", value: 123 } }, // todo make realistic (correct types)
          fetchError: undefined,
          fetchStatus: "success",
        },
        status: {
          data: { status: "completed" }, // todo make realistic (correct types)
          fetchError: undefined,
          fetchStatus: "success",
        },
      };

      store.clearScenario();
      expect(store.currentScenario).toEqual({
        runId: undefined,
        parameters: undefined,
        result: {
          data: undefined,
          fetchError: undefined,
          fetchStatus: undefined,
        },
        status: {
          data: undefined,
          fetchError: undefined,
          fetchStatus: undefined,
        },
      });
    });
  });
});
