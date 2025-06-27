import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, NewScenarioData, ScenarioData, ScenarioResultData, ScenarioStatusData, TimeSeriesGroup, VersionData } from "~/types/apiResponseTypes";
import type { AppState, Comparison, Scenario } from "@/types/storeTypes";
import type { FetchError } from "ofetch";
import { type Parameter, type ParameterSet, TypeOfParameter } from "@/types/parameterTypes";
import { debounce } from "perfect-debounce";
import { defineStore } from "pinia";
import { ExcelScenarioDownload } from "~/download/excelScenarioDownload";
import type { ScenarioCapacity, ScenarioCost, ScenarioIntervention } from "~/types/resultTypes";
import { CostBasis } from "~/types/unitTypes";

const emptyScenario = {
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
} as Scenario;
deepFreeze(emptyScenario);

const emptyComparison = {
  axis: undefined,
  baseline: undefined,
  scenarios: [],
} as Comparison;
deepFreeze(emptyComparison);

export const useAppStore = defineStore("app", {
  state: (): AppState => structuredClone({
    globe: {
      interactive: false,
      highlightedCountry: null,
    },
    largeScreen: true,
    versions: undefined,
    metadata: undefined,
    metadataFetchError: undefined,
    metadataFetchStatus: undefined,
    downloading: false,
    downloadError: undefined,
    currentScenario: emptyScenario,
    currentComparison: emptyComparison,
    preferences: {
      costBasis: CostBasis.USD, // Default cost basis for first-time visitors
    },
  }),
  persist: {
    pick: ["preferences"],
  },
  getters: {
    globeParameter: (state): Parameter | undefined => state.metadata?.parameters.find(param => param.parameterType === TypeOfParameter.GlobeSelect),
    timeSeriesData: (state): Record<string, number[]> | undefined => state.currentScenario.result.data?.time_series,
    capacitiesData: (state): Array<ScenarioCapacity> | undefined => state.currentScenario.result.data?.capacities,
    interventionsData: (state): Array<ScenarioIntervention> | undefined => state.currentScenario.result.data?.interventions,
    costsData: (state): Array<ScenarioCost> | undefined => state.currentScenario.result.data?.costs,
    totalCost(): ScenarioCost | undefined {
      if (this.costsData?.[0]?.id === "total") {
        return this.costsData[0];
      }
      return undefined;
    },
    scenarioCountry(state): string | undefined {
      if (this.globeParameter?.id && state.currentScenario.parameters) {
        return state.currentScenario.parameters[this.globeParameter.id!];
      } else {
        return undefined;
      }
    },
    timeSeriesGroups: (state): Array<TimeSeriesGroup> | undefined => state.metadata?.results.time_series_groups as TimeSeriesGroup[] | undefined,
  },
  actions: {
    async loadScenarioFromDB(scenario: Scenario) {
      if (!scenario.runId) {
        console.error("No runId provided for scenario load.");
        return;
      }

      const { data, status } = await useFetch(
        `/api/scenarios/${scenario.runId}/details`,
      ) as {
        data: Ref<ScenarioData>
        status: Ref<AsyncDataRequestStatus>
      };

      if (status.value === "success" && data.value.runId) {
        scenario.runId = data.value.runId;
        scenario.parameters = data.value.parameters;
      }
    },
    async runScenarioByParameters(parameters: ParameterSet | undefined) {
      if (!parameters) {
        console.error("No parameters provided for scenario run.");
        return;
      }

      const response = await $fetch<NewScenarioData>("/api/scenarios", {
        method: "POST",
        body: { parameters },
      }).catch((error: FetchError) => {
        console.error(error);
      });

      if (response) {
        const { runId } = response;

        return runId;
      }
    },
    async refreshScenarioStatus(scenario: Scenario) {
      if (!scenario.runId || scenario.status.data?.done) {
        return;
      }

      const { data, status: fetchStatus, error } = await useFetch(
        `/api/scenarios/${scenario.runId}/status`,
        { dedupe: "defer" },
      ) as {
        data: Ref<ScenarioStatusData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError>
      };

      scenario.status = {
        data: { ...data.value, runId: null },
        fetchStatus: fetchStatus.value,
        fetchError: error.value || undefined,
      };
    },
    async loadScenarioResult(scenario: Scenario) {
      if (!scenario.runId) {
        return;
      }

      const { data, status, error } = await useFetch(
        `/api/scenarios/${scenario.runId}/result`,
        { dedupe: "defer" },
      ) as {
        data: Ref<ScenarioResultData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError | undefined>
      };
      scenario.result = {
        data: { ...data.value, runId: null },
        fetchStatus: status.value,
        fetchError: error.value || undefined,
      };
    },
    async loadMetadata() {
      const { data: metadata, status: metadataFetchStatus, error: metadataFetchError } = await useFetch("/api/metadata") as {
        data: Ref<Metadata>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError | undefined>
      };
      this.metadata = metadata.value;
      this.metadataFetchStatus = metadataFetchStatus.value;
      this.metadataFetchError = metadataFetchError.value;
    },
    // This function is designed to be called e.g. in onMounted lifecycle hooks, not
    // setup scripts (hence the use of $fetch rather than useFetch), since version data
    // does not need to be immediately available as soon as the page loads. We therefore
    // don't need to make the render of the page wait for this data to be fetched.
    // Just in case this mission-non-critical fetch takes a long time.
    loadVersionData(): void {
      $fetch("/api/versions", {
        onResponse: ({ response }) => {
          const data = response._data;
          if (data.daedalusModel) {
            this.versions = data as VersionData;
          }
        },
      });
    },
    clearCurrentScenario() {
      this.currentScenario = structuredClone(emptyScenario);
    },
    setComparison(axis: string, baselineParameters: ParameterSet, selectedScenarioOptions: string[]) {
      const newComparison = structuredClone(emptyComparison);

      newComparison.axis = axis;
      newComparison.baseline = baselineParameters[axis];
      const allScenarioOptions = [newComparison.baseline, ...selectedScenarioOptions];
      newComparison.scenarios = allScenarioOptions.map((opt) => {
        return structuredClone({
          ...emptyScenario,
          parameters: {
            ...baselineParameters,
            [axis]: opt,
          },
        });
      });

      this.currentComparison = newComparison;
    },
    async setCurrentComparisonByRunIds(runIds: string[]) {
      this.currentComparison.scenarios = runIds.map((runId) => {
        return structuredClone({ ...emptyScenario, runId });
      });

      await Promise.all(
        this.currentComparison.scenarios?.map(async (scenario) => {
          await this.loadScenarioFromDB(scenario);
        }) || [],
      );
    },
    async downloadExcel() {
      this.downloadError = undefined;
      this.downloading = true;
      await debounce(async () => {
        try {
          new ExcelScenarioDownload(this.currentScenario).download();
        } catch (e) {
          let downloadError = "Unexpected download error";
          if (typeof e === "string") {
            downloadError = e;
          } else if ((e as any).message) {
            downloadError = (e as any).message;
          }
          this.downloadError = downloadError;
        } finally {
          this.downloading = false;
        }
      }, 200)(); // include small delay to avoid tooltip flicker on immediate button disable
    },
    getCostLabel(costId: string): string {
      const name = this.metadata?.results.costs.find(
        cost => cost.id === costId,
      )?.label;
      return name || costId;
    },
  },
});
