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
import { getRangeForDependentParam } from "~/components/utils/parameters";
import { responseInterventionId } from "~/components/utils/timeSeriesData";

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
    parametersMetadataById: (state): Record<string, Parameter> => {
      return Object.fromEntries(state.metadata?.parameters?.map(param => [param.id, param]) || []);
    },
    globeParameter: (state): Parameter | undefined => state.metadata?.parameters.find(param => param.parameterType === TypeOfParameter.GlobeSelect),
    timeSeriesData: (state): Record<string, number[]> | undefined => state.currentScenario.result.data?.time_series,
    capacitiesData: (state): Array<ScenarioCapacity> | undefined => state.currentScenario.result.data?.capacities,
    interventionsData: (state): Array<ScenarioIntervention> | undefined => state.currentScenario.result.data?.interventions,
    costsData: (state): Array<ScenarioCost> | undefined => state.currentScenario.result.data?.costs,
    totalCost(): ScenarioCost | undefined {
      if (this.costsData?.[0]?.id === "total") {
        return this.costsData[0];
      }
    },
    scenarioCountry(state): string | undefined {
      if (!this.globeParameter?.id) {
        return;
      }
      if (state.currentComparison.scenarios?.[0]?.parameters) {
        if (state.currentComparison.axis === this.globeParameter.id) {
          return state.currentComparison.baseline;
        } else if (state.currentComparison.axis) {
          return state.currentComparison.scenarios[0].parameters[this.globeParameter.id];
        }
      } else if (state.currentScenario?.parameters) {
        return state.currentScenario.parameters[this.globeParameter.id!];
      }
    },
    timeSeriesGroups: (state): Array<TimeSeriesGroup> | undefined => state.metadata?.results.time_series_groups as TimeSeriesGroup[] | undefined,
    everyScenarioHasRunSuccessfully: (state): boolean => {
      return state.currentComparison.scenarios?.length > 0
        && state.currentComparison.scenarios?.every(s => s.status.data?.runSuccess);
    },
    everyScenarioHasARunId: (state): boolean => {
      return state.currentComparison.scenarios?.length > 0
        && state.currentComparison.scenarios?.every(s => !!s.runId);
    },
    everyScenarioHasCosts: (state): boolean => {
      return state.currentComparison.scenarios?.map(s => s.result.data?.costs).every(c => !!c && c.length > 0);
    },
    axisLabel(state): string | undefined {
      if (state.currentComparison.axis) {
        return this.parametersMetadataById[state.currentComparison.axis].label;
      }
    },
    baselineScenario(state): Scenario | undefined {
      return state.currentComparison.scenarios.find((scenario) => {
        if (state.currentComparison.axis && scenario.parameters) {
          return scenario.parameters[state.currentComparison.axis] === state.currentComparison.baseline;
        } else {
          return false;
        }
      });
    },
  },
  actions: {
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
    clearScenario(scenario: Scenario) {
      Object.assign(scenario, structuredClone(emptyScenario));
    },
    async loadScenarioDetails(scenario: Scenario) {
      if (!scenario.runId) {
        throw new Error("No runId provided for scenario load.");
      }

      const { data, status } = await useFetch(
        `/api/scenarios/${scenario.runId}/details`,
      ) as {
        data: Ref<ScenarioData>
        status: Ref<AsyncDataRequestStatus>
      };

      if (status.value === "success") {
        scenario.parameters = data.value.parameters;
      }
    },
    async runScenario(scenario: Scenario) {
      const parameters = scenario.parameters;
      if (!parameters) {
        throw new Error("No parameters provided for scenario run.");
      }
      const response = await $fetch<NewScenarioData>("/api/scenarios", {
        method: "POST",
        body: { parameters },
      }).catch((error: FetchError) => {
        console.error(error);
      });

      if (response) {
        const { runId } = response;

        this.clearScenario(scenario);
        scenario.runId = runId;
        scenario.parameters = parameters;
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
        throw new Error("No runId provided for scenario result load.");
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
    async setComparisonByRunIds(newRunIds: string[], baseline: string, axis: string) {
      this.currentComparison.scenarios = newRunIds.map((runId) => {
        return structuredClone({ ...emptyScenario, runId });
      });

      await Promise.all(
        this.currentComparison.scenarios?.map(async (scenario) => {
          await this.loadScenarioDetails(scenario);
        }) || [],
      );

      this.currentComparison.baseline = baseline;
      this.currentComparison.axis = axis;
    },
    async runComparison(axis: string, baselineParameters: ParameterSet, selectedScenarioOptions: string[]) {
      if (!this.metadata) {
        throw new Error("Metadata is not loaded, cannot set comparison.");
      }

      const newComparison = structuredClone(emptyComparison);

      newComparison.axis = axis;
      newComparison.baseline = baselineParameters[axis];
      const allScenarioOptions = [newComparison.baseline, ...selectedScenarioOptions];

      const paramsDependingOnAxis = this.metadata?.parameters.filter((param) => {
        return param.updateNumericFrom?.parameterId === axis;
      });

      newComparison.scenarios = allScenarioOptions.map((opt) => {
        const parameterVals: ParameterSet = { ...baselineParameters, [axis]: opt };

        paramsDependingOnAxis?.forEach((param) => {
          const range = getRangeForDependentParam(param, parameterVals);
          if (range) {
            parameterVals[param.id] = range.default.toString();
          }
        });

        return structuredClone({ ...emptyScenario, parameters: parameterVals });
      });

      this.currentComparison = newComparison;

      await Promise.all(
        this.currentComparison.scenarios?.map(async (scenario) => {
          await this.runScenario(scenario);
        }) || [],
      );
    },
    async refreshComparisonStatuses() {
      await Promise.all(this.currentComparison.scenarios?.map(async (scenario) => {
        await this.refreshScenarioStatus(scenario);
      }) || []);
    },
    async loadComparisonResults() {
      await Promise.all(this.currentComparison.scenarios?.map(async (scenario) => {
        await this.loadScenarioResult(scenario);
      }) || []);
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
    getScenarioAxisValue(scenario: Scenario): string | undefined {
      return this.currentComparison.axis ? scenario.parameters?.[this.currentComparison.axis] : undefined;
    },
    getScenarioResponseInterventions(scenario: Scenario): ScenarioIntervention[] | undefined {
      return scenario.result.data?.interventions.filter(({ id }) => id === responseInterventionId);
    },
  },
});
