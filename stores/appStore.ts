import { defineStore } from "pinia";
import { debounce } from "perfect-debounce";
import type { FetchError } from "ofetch";
import type { AsyncDataRequestStatus } from "#app";
import type { AppState } from "@/types/storeTypes";
import type { Metadata, ScenarioResultData, ScenarioStatusData, VersionData } from "@/types/apiResponseTypes";
import { type Parameter, TypeOfParameter } from "@/types/parameterTypes";
import type { ScenarioCapacity, ScenarioIntervention } from "~/types/resultTypes";
import { ExcelScenarioDownload } from "~/download/excelScenarioDownload";

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
    downloading: false,
    downloadError: undefined,
    currentScenario: { ...emptyScenario },
  }),
  getters: {
    globeParameter: (state): Parameter | undefined => state.metadata?.parameters.find(param => param.parameterType === TypeOfParameter.GlobeSelect),
    timeSeriesData: (state): Record<string, number[]> | undefined => state.currentScenario.result.data?.time_series,
    capacitiesData: (state): Array<ScenarioCapacity> | undefined => state.currentScenario.result.data?.capacities,
    interventionsData: (state): Array<ScenarioIntervention> | undefined => state.currentScenario.result.data?.interventions,
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
        data: scenarioStatusData.value,
        fetchStatus: scenarioStatusFetchStatus.value,
        fetchError: scenarioStatusFetchError.value,
      };
    },
    async loadScenarioResults() {
      if (!this.currentScenario.runId) {
        return;
      }

      const { data, status, error } = await useFetch(`/api/scenarios/result/${this.currentScenario.runId}`) as {
        data: Ref<ScenarioResultData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError | undefined>
      };
      this.currentScenario.result = {
        data: data.value,
        fetchStatus: status.value,
        fetchError: error.value,
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
    clearScenario() {
      this.currentScenario = { ...emptyScenario };
    },
    async downloadExcel() {
      this.downloading = true;
      await debounce(async () => {
        this.downloadError = undefined;
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
      })();
    },
  },
});
