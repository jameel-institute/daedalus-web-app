// Types for responses from our API endpoints.
import type { Parameter, ParameterSet } from "./parameterTypes";
import type { ScenarioCapacity, ScenarioCost, ScenarioIntervention } from "./resultTypes";

export interface ApiError {
  error: string
  detail: string
}
export interface ApiResponse<T extends object = object> {
  statusText: string
  statusCode: number
  errors: Array<ApiError> | null
  data: T | null
}

// Version
export interface VersionData {
  daedalusModel: string
  daedalusApi: string
  daedalusWebApp: string
}

export interface VersionDataResponse extends ApiResponse<VersionData> { }

// Metadata
export interface DisplayInfo {
  id: string
  label: string
  description?: string
}
export interface TimeSeriesGroup {
  id: string
  label: string
  time_series: {
    [key: string]: string
  }
}
export type ResultsMetadata = Record<string, Array<DisplayInfo> | Array<TimeSeriesGroup>>;
export interface Metadata {
  modelVersion: string
  parameters: Array<Parameter>
  results: ResultsMetadata
}

export interface MetadataResponse extends ApiResponse<Metadata> { }

// Scenario
export interface ScenarioData {
  parameters: ParameterSet
  runId: string | null
}

export interface NewScenarioData {
  runId: string
}
export interface NewScenarioResponse extends ApiResponse<NewScenarioData> { }

export enum runStatus {
  Queued = "queued",
  Running = "running",
  Complete = "complete",
  Failed = "failed",
}

export interface ScenarioStatusData {
  done: boolean // whether the job is finished or not
  runId: string | null
  runErrors: Array<string> | null
  runStatus: runStatus
  runSuccess: boolean | null // null if "done" is false, otherwise indicates whether the job finished successfully
}
export interface ScenarioStatusResponse extends ApiResponse<ScenarioStatusData> { }

export interface ScenarioResultData {
  runId: string | null
  parameters: ParameterSet
  costs: Array<ScenarioCost>
  capacities: Array<ScenarioCapacity>
  interventions: Array<ScenarioIntervention>
  time_series: Record<string, number[]>
  gdp: number
  average_vsl: number
}
export interface ScenarioResultResponse extends ApiResponse<ScenarioResultData> { }
