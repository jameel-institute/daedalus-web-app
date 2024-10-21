import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, ScenarioResultData, ScenarioStatusData, VersionData } from "@/types/apiResponseTypes";
import type { ParameterSet } from "@/types/parameterTypes";
import type { FetchError } from "ofetch";

export interface Scenario {
  runId: string | undefined
  parameters: ParameterSet | undefined
  result: {
    data: ScenarioResultData | undefined
    fetchError: FetchError | undefined
    fetchStatus: AsyncDataRequestStatus | undefined
  }
  status: {
    data: ScenarioStatusData | undefined
    fetchError: FetchError | undefined
    fetchStatus: AsyncDataRequestStatus | undefined
  }
}
export interface AppState {
  globe: {
    interactive: boolean
    tentativelySelectedCountry: string | null
  }
  largeScreen: boolean
  versions: VersionData | undefined
  metadata: Metadata | undefined
  metadataFetchError: FetchError | undefined
  metadataFetchStatus: AsyncDataRequestStatus | undefined
  downloading: boolean
  downloadError: string | undefined
  currentScenario: Scenario // Represents the scenario currently being viewed
};
