import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, ScenarioResultData, ScenarioStatusData, TimeSeriesGroup, VersionData } from "@/types/apiResponseTypes";
import type { AppState } from "@/types/storeTypes";
import type { FetchError } from "ofetch";
import { type Parameter, TypeOfParameter } from "@/types/parameterTypes";
import { debounce } from "perfect-debounce";
import { defineStore } from "pinia";
import { ExcelScenarioDownload } from "~/download/excelScenarioDownload";
import type { ScenarioCapacity, ScenarioCost, ScenarioIntervention } from "~/types/resultTypes";

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
      highlightedCountry: null,
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
    async loadScenarioStatus() {
      if (!this.currentScenario.runId) {
        return;
      }

      const {
        data: scenarioStatusData,
        status: scenarioStatusFetchStatus,
        error: scenarioStatusFetchError,
      } = await useFetch(`/api/scenarios/${this.currentScenario.runId}/status`, { dedupe: "defer" }) as {
        data: Ref<ScenarioStatusData>
        status: Ref<AsyncDataRequestStatus>
        error: Ref<FetchError>
      };

      this.currentScenario.status = {
        data: { ...scenarioStatusData.value, runId: undefined },
        fetchStatus: scenarioStatusFetchStatus.value,
        fetchError: scenarioStatusFetchError.value || undefined,
      };
    },
    async loadScenarioResult() {
      if (!this.currentScenario.runId) {
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
      this.currentScenario.parameters = this.currentScenario.result.data?.parameters;
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
