import type { AsyncDataRequestStatus } from "#app";
import type { Metadata, ScenarioResultData, ScenarioStatusData, VersionData } from "~/types/apiResponseTypes";
import type { ParameterSet } from "@/types/parameterTypes";
import type { FetchError } from "ofetch";
import type { CostBasis } from "./unitTypes";

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

export interface Comparison {
  axis: string | undefined
  baseline: string | undefined
  scenarios: Scenario[]
}

export interface AppState {
  globe: {
    interactive: boolean
    highlightedCountry: string | null
  }
  largeScreen: boolean
  versions: VersionData | undefined
  metadata: Metadata | undefined
  metadataFetchError: FetchError | undefined
  metadataFetchStatus: AsyncDataRequestStatus | undefined
  downloading: boolean
  downloadError: string | undefined
  currentScenario: Scenario // Represents the scenario currently being viewed
  currentComparison: Comparison // Represents the multi-scenario comparison currently being viewed
  preferences: {
    costBasis: CostBasis
    openedTimeSeriesAccordions: string[]
  }
};
