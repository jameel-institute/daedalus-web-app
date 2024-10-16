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
export type ResultsMetadata = Record<string, Array<DisplayInfo>>;
export interface Metadata {
  modelVersion: string
  parameters: Array<Parameter>
  results: ResultsMetadata
}

export interface MetadataResponse extends ApiResponse<Metadata> { }

// Scenario
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
  runId?: string
  runErrors: Array<string> | null
  runStatus: runStatus
  runSuccess: boolean | null // null if "done" is false, otherwise indicates whether the job finished successfully
}

export interface ScenarioStatusResponse extends ApiResponse<ScenarioStatusData> { }

export interface ScenarioResultData {
  runId?: string
  parameters: ParameterSet
  costs: Array<ScenarioCost>
  capacities: Array<ScenarioCapacity>
  interventions: Array<ScenarioIntervention>
  time_series: Record<string, number[]>
  gdp: number // The annual GDP of the country in question (as of 2018)
}

export interface ScenarioResultResponse extends ApiResponse<ScenarioResultData> { }
