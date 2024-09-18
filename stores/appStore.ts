import { defineStore } from "pinia";
import type { FetchError } from "ofetch";
import type { AsyncDataRequestStatus } from "#app";
import type { AppState } from "@/types/storeTypes";
import type { Metadata, ScenarioStatusData, VersionData } from "@/types/apiResponseTypes";
import { TypeOfParameter } from "@/types/parameterTypes";

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
    currentScenario: { // Represents the scenario currently being viewed
      runId: undefined,
      parameters: undefined,
      status: {
        statusData: undefined,
        scenarioStatusFetchError: undefined,
        scenarioStatusFetchStatus: undefined,
      },
    },
  }),
  getters: {
    globeParameter: state => state.metadata?.parameters.find(param => param.parameterType === TypeOfParameter.GlobeSelect),
  },
  actions: {
    async loadScenarioStatus() {
      if (!this.currentScenario.runId) {
        return;
      }

      const {
        data: scenarioStatusData,
        status: scenarioStatusFetchStatus,
        error: scenarioStatusFetchError,
      } = await useFetch(`/api/scenarios/status/${this.currentScenario.runId}`) as {
        data: Ref<ScenarioStatusData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError | undefined>
      };
      this.currentScenario.status = {
        statusData: scenarioStatusData.value,
        scenarioStatusFetchStatus: scenarioStatusFetchStatus.value,
        scenarioStatusFetchError: scenarioStatusFetchError.value,
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
  },
});
