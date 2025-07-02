import * as ExcelDownload from "@/download/excelScenarioDownload";
import { useAppStore } from "@/stores/appStore";
import {
  emptyScenario,
  mockedMetadata,
  mockResultData,
} from "@/tests/unit/mocks/mockPinia";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { runStatus } from "~/types/apiResponseTypes";
import { CostBasis } from "~/types/unitTypes";

const sampleUnloadedScenario = {
  ...emptyScenario,
  runId: "123",
  parameters: { country: "USA" },
};
const mockResultDataWithoutRunId = { ...mockResultData, runId: null };

registerEndpoint("/api/versions", () => {
  return {
    daedalusModel: "1.2.3",
    daedalusApi: "4.5.6",
    daedalusWebApp: "7.8.9",
  };
});

const metadata = {
  parameters: [
    { id: "country", parameterType: "globeSelect" },
    { id: "settings", parameterType: "select" },
  ],
  results: {
    costs: [{ id: "total", label: "Total" }],
    time_series_groups: [
      {
        id: "infections",
        label: "Infections",
        time_series: {
          total: "prevalence",
          daily: "new_infected",
        },
      },
    ],
  },
  modelVersion: "1.2.3",
};

registerEndpoint("/api/metadata", () => metadata);

registerEndpoint("/api/scenarios/123/details", () => {
  return {
    parameters: { ...mockResultData.parameters },
    runId: "123",
  };
});

registerEndpoint("/api/scenarios/456/details", () => {
  return {
    parameters: { ...mockResultData.parameters, country: "THA" },
    runId: "456",
  };
});

const mockedRunScenarioResponse = vi.fn();
registerEndpoint("/api/scenarios", {
  method: "POST",
  handler: mockedRunScenarioResponse,
});

registerEndpoint("/api/scenarios/123/status", () => {
  return {
    done: true,
    runId: "123",
    runErrors: null,
    runStatus: "complete",
    runSuccess: true,
  };
});

registerEndpoint("/api/scenarios/123/result", () => {
  return mockResultData;
});

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("initialises correctly", async () => {
    const store = useAppStore();
    expect(store.versions).toBeUndefined();
    expect(store.metadata).toBeUndefined();
    expect(store.largeScreen).toBe(true);
    expect(store.preferences.costBasis).toBe(CostBasis.USD);
  });

  describe("actions", () => {
    it("can load a scenario from the database", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(sampleUnloadedScenario);
      await store.loadScenarioFromDB(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.runId).toBe("123");
        expect(store.currentScenario.parameters).toEqual({
          country: "GBR",
          pathogen: "sars_cov_1",
          response: "none",
          vaccine: "none",
          hospital_capacity: "30500",
        });
      });
    });

    it("can load multiple scenarios from the database by their run ids", async () => {
      const store = useAppStore();
      const runIds = ["123", "456", "789"];
      await store.setCurrentComparisonByRunIds(runIds);

      await waitFor(() => {
        expect(store.currentComparison.scenarios.length).toBe(3);
        expect(store.currentComparison.scenarios[0].runId).toEqual("123");
        expect(store.currentComparison.scenarios[1].runId).toEqual("456");
        expect(store.currentComparison.scenarios[2].runId).toEqual("789");
        expect(store.currentComparison.scenarios[0].parameters?.country).toEqual("GBR");
        expect(store.currentComparison.scenarios[1].parameters?.country).toEqual("THA");
        expect(store.currentComparison.scenarios[2].parameters).not.toBeDefined();
      });
    });

    it("can run a new scenario by parameters, returning a runId", async () => {
      mockedRunScenarioResponse.mockImplementation(async (event) => {
        const body = await readBody(event);
        const params = body.parameters;
        if (String(params.country) === "GBR" && String(params.pathogen) === "sars_cov_1") {
          return { runId: "345" };
        }

        throw new Error("The test failed to pass the correct parameters to the Nuxt app API.");
      });

      const store = useAppStore();
      const result = await store.runScenarioByParameters({
        country: "GBR",
        pathogen: "sars_cov_1",
      });

      expect(result).toBe("345");
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
        expect(store.metadata).toEqual(metadata);
      });
      expect(store.metadataFetchStatus).toBe("success");
    });

    it("can retrieve a scenario's status from the R API", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(sampleUnloadedScenario);
      await store.refreshScenarioStatus(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.status).toEqual({
          data: {
            done: true,
            runId: null,
            runErrors: null,
            runStatus: "complete",
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        });
      });
    });

    it("can load a scenario's results from the R API", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(sampleUnloadedScenario);
      await store.loadScenarioResult(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.result.data).toEqual(
          mockResultDataWithoutRunId,
        );
        expect(store.currentScenario.result.fetchError).toEqual(undefined);
        expect(store.currentScenario.result.fetchStatus).toEqual("success");
      });
    });

    it("can clear the current scenario", async () => {
      const store = useAppStore();
      store.currentScenario = {
        runId: "123",
        parameters: { country: "USA" },
        result: {
          data: mockResultDataWithoutRunId,
          fetchError: undefined,
          fetchStatus: "success",
        },
        status: {
          data: {
            done: true,
            runId: null,
            runStatus: runStatus.Complete,
            runErrors: null,
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        },
      };

      store.clearCurrentScenario();
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

    const mockExcelScenarioDownload = (mockDownload = () => { }) => {
      // Mock ExelScenarioDownload constructor and return mock
      // instance with given download mock implementation
      const mockExcelScenarioDownloadObj = {
        download: vi.fn().mockImplementation(mockDownload),
      } as any;
      const downloadConstructorSpy = vi.spyOn(
        ExcelDownload,
        "ExcelScenarioDownload",
      );
      downloadConstructorSpy.mockImplementation(
        () => mockExcelScenarioDownloadObj,
      );
      return mockExcelScenarioDownloadObj;
    };

    it("can download scenario", async () => {
      const mockDownloadObj = mockExcelScenarioDownload();

      const store = useAppStore();
      const downloadPromise = store.downloadExcel();
      // Should immediately set to downloading, then reset when download finishes
      expect(store.downloading).toBe(true);
      // wait for the promise to resolve
      await expect(downloadPromise).resolves.toBe(undefined);
      expect(store.downloading).toBe(false);
      expect(store.downloadError).toBe(undefined);
      expect(mockDownloadObj.download).toHaveBeenCalled();
    });

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

    it("can set the current comparison based on the axis, baseline parameter, and selected scenario options", async () => {
      const store = useAppStore();
      store.setComparison("vaccine", { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" }, ["none", "low"]);

      expect(store.currentComparison).toEqual({
        axis: "vaccine",
        baseline: "high",
        scenarios: [
          {
            ...emptyScenario,
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "none", response: "elimination" },
          },
          {
            ...emptyScenario,
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "low", response: "elimination" },
          },
        ],
      });
    });

    describe("getters", () => {
      it("can get the globe parameter", async () => {
        const store = useAppStore();
        expect(store.globeParameter).toEqual(undefined);

        await store.loadMetadata();

        await waitFor(() => {
          expect(store.globeParameter).toEqual({
            id: "country",
            parameterType: "globeSelect",
          });
        });
      });

      it("can get the time series data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(sampleUnloadedScenario);

        expect(store.timeSeriesData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.timeSeriesData).toEqual(mockResultData.time_series);
        });
      });

      it("can get the capacities data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(sampleUnloadedScenario);

        expect(store.capacitiesData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.capacitiesData).toEqual(mockResultData.capacities);
        });
      });

      it("can get the interventions data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(sampleUnloadedScenario);

        expect(store.interventionsData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.interventionsData).toEqual(mockResultData.interventions);
        });
      });

      it("can get the costs data and 'total' cost data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(sampleUnloadedScenario);

        expect(store.costsData).toEqual(undefined);
        expect(store.totalCost).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.costsData).toEqual(mockResultData.costs);
        });

        expect(store.totalCost?.id).toEqual("total");
        expect(store.totalCost?.value).toEqual(1086625.0137);
        expect(store.totalCost?.children?.length).toEqual(3);
      });

      it("can get the time series groups metadata", async () => {
        const store = useAppStore();
        expect(store.timeSeriesGroups).toEqual(undefined);

        await store.loadMetadata();

        await waitFor(() => {
          expect(store.timeSeriesGroups).toEqual([
            {
              id: "infections",
              label: "Infections",
              time_series: {
                total: "prevalence",
                daily: "new_infected",
              },
            },
          ]);
        });
      });

      it("getCostLabel returns the label for cost id", async () => {
        const store = useAppStore();
        store.metadata = mockedMetadata;

        const costLabel = store.getCostLabel("gdp_closures");

        expect(costLabel).toEqual("Closures");
      });

      it("getCostLabel returns cost id if not found in metadata", async () => {
        const store = useAppStore();
        store.metadata = mockedMetadata;

        const costLabel = store.getCostLabel("not_found");

        expect(costLabel).toEqual("not_found");
      });
    });
  });
});
