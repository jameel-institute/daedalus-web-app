import { defineStore } from "pinia";
import type { FetchError } from "ofetch";
import type { AsyncDataRequestStatus } from "#app";
import type { AppState } from "@/types/storeTypes";
import type { Metadata, NewScenarioData, ScenarioResultData, ScenarioStatusData, VersionData } from "@/types/apiResponseTypes";
import { type Parameter, type ParameterSet, TypeOfParameter } from "@/types/parameterTypes";
import type { ScenarioCapacity, ScenarioIntervention } from "~/types/resultTypes";

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
};
Object.freeze(emptyScenario);

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    globe: {
      interactive: false,
    },
    largeScreen: true,
    versions: undefined,
    metadata: undefined,
    metadataFetchError: undefined,
    metadataFetchStatus: undefined,
    currentScenario: { ...emptyScenario },
    scenarios: {},
  }),
  getters: {
    globeParameter: (state): Parameter | undefined => state.metadata?.parameters.find(param => param.parameterType === TypeOfParameter.GlobeSelect),
    timeSeriesData: (state): Record<string, number[]> | undefined => state.currentScenario.result.data?.time_series,
    capacitiesData: (state): Array<ScenarioCapacity> | undefined => state.currentScenario.result.data?.capacities,
    interventionsData: (state): Array<ScenarioIntervention> | undefined => state.currentScenario.result.data?.interventions,
  },
  actions: {
    async runScenario(parameters: ParameterSet): Promise<true | undefined> {
      this.clearCurrentScenario();
      this.currentScenario.parameters = parameters;
      this._storeScenario();

      const response = await $fetch<NewScenarioData>("/api/scenarios", {
        method: "POST",
        body: { parameters },
      }).catch((error: FetchError) => {
        console.error(error);
      });

      if (response) {
        const { runId } = response;
        if (runId) {
          this.currentScenario.runId = runId;
          this._storeScenario();
          return true;
        }
      }
    },
    async fetchScenarioStatus() {
      if (!this.currentScenario.runId) {
        console.error("No runId to fetch scenario status for");
        return;
      }

      const {
        data: scenarioStatusData,
        status: scenarioStatusFetchStatus,
        error: scenarioStatusFetchError,
      } = await useFetch(`/api/scenarios/${this.currentScenario.runId}/status`) as {
        data: Ref<ScenarioStatusData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError>
      };

      this.currentScenario.status = {
        data: { ...scenarioStatusData.value, runId: undefined },
        fetchStatus: scenarioStatusFetchStatus.value,
        fetchError: scenarioStatusFetchError.value || undefined,
      };

      this._storeScenario();
    },
    async fetchScenarioResult() {
      if (!this.currentScenario.runId) {
        console.error("No runId to fetch scenario result for");
        return;
      }

      const { data, status, error } = await useFetch(`/api/scenarios/${this.currentScenario.runId}/result`) as {
        data: Ref<ScenarioResultData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError | undefined>
      };
      this.currentScenario.result = {
        data: { ...data.value, runId: undefined },
        fetchStatus: status.value,
        fetchError: error.value || undefined,
      };

      this._storeScenario();
    },
    clearCurrentScenario() {
      this.currentScenario = { ...emptyScenario };
    },
    loadScenarioFromStore(runId: string) {
      console.error("Loading scenario with runId", runId);
      console.error(Object.values(this.scenarios).length);
      if (this.scenarios[runId]) {
        this.currentScenario = { ...this.scenarios[runId] };
        return true;
      } else {
        console.error(`Scenario with runId ${runId} not found in store`);
        return false;
      }
    },
    _storeScenario() { // Keep a record of the current scenario's data in the scenarios object
      if (this.currentScenario.runId) {
        console.error("Storing scenario data for country", this.currentScenario.parameters?.country);
        console.error("and runId", this.currentScenario.runId);

        this.scenarios[this.currentScenario.runId] = { ...this.currentScenario };

        console.error(this.scenarios);
      }
    },
    async fetchMetadata() {
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
    fetchVersionData(): void {
      $fetch("/api/versions", {
        onResponse: ({ response }) => {
          const data = response._data;
          if (data.daedalusModel) {
            this.versions = data as VersionData;
          }
        },
      });
    },
  },
});
