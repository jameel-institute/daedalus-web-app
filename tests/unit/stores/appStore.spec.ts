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
import { flushPromises } from "@vue/test-utils";
import { mockMetadataResponseData } from "../mocks/mockResponseData";

const unloadedScenario = {
  ...emptyScenario,
  runId: "123",
  parameters: { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" },
};

registerEndpoint("/api/versions", () => {
  return {
    daedalusModel: "1.2.3",
    daedalusApi: "4.5.6",
    daedalusWebApp: "7.8.9",
  };
});

registerEndpoint("/api/metadata", () => mockMetadataResponseData);

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

const defaultStatusResponseData = {
  done: true,
  runErrors: null,
  runStatus: runStatus.Complete,
  runSuccess: true,
};

registerEndpoint("/api/scenarios/123/status", () => {
  return { ...defaultStatusResponseData, runId: "123" };
});

registerEndpoint("/api/scenarios/234/status", () => {
  return { ...defaultStatusResponseData, runId: "234", runStatus: runStatus.Queued };
});

registerEndpoint("/api/scenarios/345/status", () => {
  return { ...defaultStatusResponseData, runId: "456", runStatus: runStatus.Running };
});

registerEndpoint("/api/scenarios/123/result", () => {
  return { ...mockResultData, runId: "123", parameters: { ...unloadedScenario.parameters } };
});

registerEndpoint("/api/scenarios/234/result", () => {
  return { ...mockResultData, runId: "234", parameters: { ...unloadedScenario.parameters, vaccine: "none" } };
});

registerEndpoint("/api/scenarios/345/result", () => {
  return { ...mockResultData, runId: "345", parameters: { ...unloadedScenario.parameters, vaccine: "low" } };
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
      store.currentScenario = structuredClone(unloadedScenario);
      await store.loadScenarioDetails(store.currentScenario);

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

    it("throws an error when no run id provided when loading a scenario from the database", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(emptyScenario);
      await expect(store.loadScenarioDetails(store.currentScenario)).rejects.toThrow(
        "No runId provided for scenario load.",
      );
    });

    it("can load multiple scenarios from the database by their run ids", async () => {
      const store = useAppStore();
      const runIds = ["123", "456", "789"];
      await store.setComparisonByRunIds(runIds, "GBR", "country");

      await waitFor(() => {
        expect(store.currentComparison.scenarios.length).toBe(3);
        expect(store.currentComparison.scenarios[0].runId).toEqual("123");
        expect(store.currentComparison.scenarios[1].runId).toEqual("456");
        expect(store.currentComparison.scenarios[2].runId).toEqual("789");
        expect(store.currentComparison.scenarios[0].parameters?.country).toEqual("GBR");
        expect(store.currentComparison.scenarios[1].parameters?.country).toEqual("THA");
        expect(store.currentComparison.scenarios[2].parameters).toBeUndefined();
        expect(store.currentComparison.axis).toEqual("country");
        expect(store.currentComparison.baseline).toEqual("GBR");
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
      store.currentScenario.result.fetchStatus = "pending";
      store.currentScenario.parameters = {
        country: "GBR",
        pathogen: "sars_cov_1",
      };
      await store.runScenario(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.runId).toBe("345");
        expect(store.currentScenario.parameters).toEqual({
          country: "GBR",
          pathogen: "sars_cov_1",
        });
        expect(store.currentScenario.result.fetchStatus).toBeUndefined();
      });
    });

    it("throws an error when no parameters provided when running a new scenario", async () => {
      const store = useAppStore();
      await expect(store.runScenario(store.currentScenario)).rejects.toThrow(
        "No parameters provided for scenario run.",
      );
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
        expect(store.metadata).toEqual(mockMetadataResponseData);
      });
      expect(store.metadataFetchStatus).toBe("success");
    });

    it("can retrieve a scenario's status from the R API", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(unloadedScenario);
      await store.refreshScenarioStatus(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.status).toEqual({
          data: {
            done: true,
            runId: null,
            runErrors: null,
            runStatus: runStatus.Complete,
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        });
      });
    });

    it("does not retrieve a scenario's status from the R API if run is already finished", async () => {
      const store = useAppStore();
      const originalStatusData = {
        done: true, // whether the job is finished or not (superset of completed and failed)
        runId: null,
        runErrors: null,
        runStatus: runStatus.Failed,
        runSuccess: true,
      };
      store.currentScenario = structuredClone({
        ...unloadedScenario,
        status: {
          ...unloadedScenario.status,
          data: { ...originalStatusData },
        },
      });
      await store.refreshScenarioStatus(store.currentScenario);

      await flushPromises();

      // Assert no changes have happened
      expect(store.currentScenario.status.data).toEqual(originalStatusData);
    });

    it("does not retrieve a scenario's status from the R API if no run Id", async () => {
      const store = useAppStore();
      const originalStatusData = {
        done: true,
        runId: null,
        runErrors: null,
        runStatus: runStatus.Failed,
        runSuccess: true,
      };
      store.currentScenario = structuredClone({
        ...unloadedScenario,
        runId: undefined,
        status: {
          ...unloadedScenario.status,
          data: { ...originalStatusData },
        },
      });
      await store.refreshScenarioStatus(store.currentScenario);

      await flushPromises();

      // Assert no changes have happened
      expect(store.currentScenario.status.data).toEqual(originalStatusData);
    });

    it("can retrieve a comparison's scenarios' statuses from the R API", async () => {
      const store = useAppStore();

      store.currentComparison = structuredClone({
        axis: "vaccine",
        baseline: "high",
        scenarios: [
          {
            ...emptyScenario,
            runId: "123",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "234",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "none", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "345",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "low", response: "elimination" },
          },
        ],
      });

      await store.refreshComparisonStatuses();

      await waitFor(() => {
        expect(store.currentComparison.scenarios.find(s => s.runId === "123")?.status).toEqual({
          data: {
            done: true,
            runId: null,
            runErrors: null,
            runStatus: runStatus.Complete,
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        });
        expect(store.currentComparison.scenarios.find(s => s.runId === "234")?.status).toEqual({
          data: {
            done: true,
            runId: null,
            runErrors: null,
            runStatus: runStatus.Queued,
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        });
        expect(store.currentComparison.scenarios.find(s => s.runId === "345")?.status).toEqual({
          data: {
            done: true,
            runId: null,
            runErrors: null,
            runStatus: runStatus.Running,
            runSuccess: true,
          },
          fetchError: undefined,
          fetchStatus: "success",
        });
      });
    });

    it("can load a scenario's results from the R API", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(unloadedScenario);
      await store.loadScenarioResult(store.currentScenario);

      await waitFor(() => {
        expect(store.currentScenario.result.data).toEqual(
          { ...mockResultData, runId: null, parameters: { ...unloadedScenario.parameters } },
        );
        expect(store.currentScenario.runId).toEqual("123");
        expect(store.currentScenario.result.fetchError).toEqual(undefined);
        expect(store.currentScenario.result.fetchStatus).toEqual("success");
      });
    });

    it("throws an error when no run id provided when loading a scenario's results", async () => {
      const store = useAppStore();
      store.currentScenario = structuredClone(emptyScenario);

      await expect(store.loadScenarioResult(store.currentScenario)).rejects.toThrow(
        "No runId provided for scenario result load.",
      );
    });

    it("can load a comparison's scenarios' results from the R API", async () => {
      const store = useAppStore();
      store.currentComparison = structuredClone({
        axis: "vaccine",
        baseline: "high",
        scenarios: [
          {
            ...emptyScenario,
            runId: "123",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "234",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "none", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "345",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "low", response: "elimination" },
          },
        ],
      });

      await store.loadComparisonResults();

      const expectedVaccineParameterByRunId = {
        123: "high",
        234: "none",
        345: "low",
      };
      await waitFor(() => {
        expect(store.currentComparison.scenarios.length).toBe(3);
        Object.entries(expectedVaccineParameterByRunId).forEach(([runId, expectedVaccineParameter]) => {
          const scenario = store.currentComparison.scenarios.find(s => s.runId === runId);
          expect(scenario!.result.fetchError).toEqual(undefined);
          expect(scenario!.result.fetchStatus).toEqual("success");
          expect(scenario!.result.data?.runId).toBeNull();
          expect(scenario!.result.data?.costs[0].value).toEqual(mockResultData.costs[0].value);
          expect(scenario!.result.data?.parameters.vaccine).toEqual(expectedVaccineParameter);
        });
      });
    });

    it("can clear the current scenario", async () => {
      const store = useAppStore();
      store.currentScenario = {
        runId: "123",
        parameters: { country: "USA" },
        result: {
          data: { ...mockResultData, runId: null },
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

      store.clearScenario(store.currentScenario);
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

    it("can run a comparison based on the axis, baseline parameter, and selected scenario options", async () => {
      mockedRunScenarioResponse.mockImplementation(async (event) => {
        const body = await readBody(event);
        const params = body.parameters;
        if (String(params.country) === "USA"
          && String(params.hospital_capacity) === "54321"
          && String(params.response) === "elimination") {
          switch (String(params.vaccine)) {
            case "high":
              return { runId: "123" };
            case "none":
              return { runId: "234" };
            case "low":
              return { runId: "345" };
          }
        }

        throw new Error("The test failed to pass the correct parameters to the Nuxt app API.");
      });

      const store = useAppStore();

      expect(async () => {
        await store.runComparison("vaccine", { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" }, ["none", "low"]);
      }).rejects.toThrowError("Metadata is not loaded, cannot set comparison.");

      await store.loadMetadata();

      await store.runComparison("vaccine", { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" }, ["none", "low"]);

      // It should not reset the 'hospital_capacity' parameter to default values unless necessitated by a change of country.
      expect(store.currentComparison).toEqual({
        axis: "vaccine",
        baseline: "high",
        scenarios: [
          {
            ...emptyScenario,
            runId: "123",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "234",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "none", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "345",
            parameters: { country: "USA", hospital_capacity: "54321", vaccine: "low", response: "elimination" },
          },
        ],
      });
    });

    it("can run a comparison, taking dependent parameters into account", async () => {
      mockedRunScenarioResponse.mockImplementation(async (event) => {
        const body = await readBody(event);
        const params = body.parameters;
        if (String(params.vaccine) === "high"
          && String(params.response) === "elimination") {
          switch (String(params.country)) {
            case "USA":
              return { runId: "456" };
            case "ARG":
              return { runId: "567" };
            case "THA":
              return { runId: "678" };
          }
        }

        throw new Error("The test failed to pass the correct parameters to the Nuxt app API.");
      });

      const store = useAppStore();
      await store.loadMetadata();

      await store.runComparison("country", { country: "USA", hospital_capacity: "54321", vaccine: "high", response: "elimination" }, ["ARG", "THA"]);

      // It should vary the dependent parameter 'hospital_capacity' as well as the country,
      // since the same absolute capacity is not equivalent in different countries.
      expect(store.currentComparison).toEqual({
        axis: "country",
        baseline: "USA",
        scenarios: [
          {
            ...emptyScenario,
            runId: "456",
            parameters: { country: "USA", hospital_capacity: "334400", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "567",
            parameters: { country: "ARG", hospital_capacity: "33800", vaccine: "high", response: "elimination" },
          },
          {
            ...emptyScenario,
            runId: "678",
            parameters: { country: "THA", hospital_capacity: "22000", vaccine: "high", response: "elimination" },
          },
        ],
      });
    });

    describe("getters", () => {
      it("can provide a map of parameter id to parameter metadata, for easier look-up", async () => {
        const store = useAppStore();
        expect(store.parametersMetadataById).toEqual({});

        await store.loadMetadata();

        await waitFor(() => {
          expect(store.parametersMetadataById).toHaveProperty("country");
          expect(store.parametersMetadataById).toHaveProperty("hospital_capacity");
          expect(store.parametersMetadataById).toHaveProperty("vaccine");
          expect(store.parametersMetadataById).toHaveProperty("response");
          expect(store.parametersMetadataById.country.parameterType).toEqual("globeSelect");
        });
      });

      it("can get the globe parameter", async () => {
        const store = useAppStore();
        expect(store.globeParameter).toEqual(undefined);

        await store.loadMetadata();

        await waitFor(() => {
          expect(store.globeParameter!.id).toEqual("country");
        });
      });

      it("can get the time series data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(unloadedScenario);

        expect(store.timeSeriesData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.timeSeriesData).toEqual(mockResultData.time_series);
        });
      });

      it("can get the capacities data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(unloadedScenario);

        expect(store.capacitiesData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.capacitiesData).toEqual(mockResultData.capacities);
        });
      });

      it("can get the interventions data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(unloadedScenario);

        expect(store.interventionsData).toEqual(undefined);
        await store.loadScenarioResult(store.currentScenario);

        await waitFor(() => {
          expect(store.interventionsData).toEqual(mockResultData.interventions);
        });
      });

      it("can get the costs data and 'total' cost data", async () => {
        const store = useAppStore();
        store.currentScenario = structuredClone(unloadedScenario);

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
          expect(store.timeSeriesGroups).toHaveLength(4);
          expect(store.timeSeriesGroups![0]).toEqual(
            {
              id: "infections",
              label: "Infections",
              time_series: {
                total: "prevalence",
                daily: "new_infected",
              },
            },
          );
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
