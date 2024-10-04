import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { useAppStore } from "@/stores/appStore";
import * as ExcelDownload from "@/download/excelScenarioDownload";

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

    const mockExcelScenarioDownload = (mockDownload = () => {}) => {
      // Mock ExelScenarioDownload constructor and return mock
      // instance with given download mock implementation
      const mockExcelScenarioDownloadObj = {
        download: vi.fn().mockImplementation(mockDownload),
      } as any;
      const downloadConstructorSpy = vi.spyOn(ExcelDownload, "ExcelScenarioDownload");
      downloadConstructorSpy.mockImplementation(() => mockExcelScenarioDownloadObj);
      return mockExcelScenarioDownloadObj;
    };

    it("can download scenario", () => new Promise((done) => {
      const mockDownloadObj = mockExcelScenarioDownload();

      const store = useAppStore();
      const downloadPromise = store.downloadExcel();
      // Should immediately set to downloading, then reset when download finishes
      expect(store.downloading).toBe(true);
      downloadPromise.finally(() => {
        expect(store.downloading).toBe(false);
        expect(store.downloadError).toBe(undefined);
        expect(mockDownloadObj.download).toHaveBeenCalled();
        done();
      });
    }));

    it("can set download error from string", async () => {
      mockExcelScenarioDownload(() => {
        // eslint-disable-next-line no-throw-literal
        throw "test error string";
      });
      const store = useAppStore();
      await store.downloadExcel();
      expect(store.downloadError).toBe("test error string");
      expect(store.downloading).toBe(false);
    });

    it("can set download error from message", async () => {
      mockExcelScenarioDownload(() => {
        throw new Error("test error message");
      });
      const store = useAppStore();
      await store.downloadExcel();
      expect(store.downloadError).toBe("test error message");
      expect(store.downloading).toBe(false);
    });
  });
});
