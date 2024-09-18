import type { FetchError } from "ofetch";
import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, ScenarioStatusData, VersionData } from "@/types/apiResponseTypes";
import type { ParameterSet } from "@/types/parameterTypes";

interface Scenario {
  runId: string | undefined
  parameters: ParameterSet | undefined
  status: {
    statusData: ScenarioStatusData | undefined
    scenarioStatusFetchError: FetchError | undefined
    scenarioStatusFetchStatus: AsyncDataRequestStatus | undefined
  }
}
export interface AppState {
  globe: {
    interactive: boolean
  }
  largeScreen: boolean
  versions: VersionData | undefined
  metadata: Metadata | undefined
  metadataFetchError: FetchError | undefined
  metadataFetchStatus: AsyncDataRequestStatus | undefined
  currentScenario: Scenario
};
