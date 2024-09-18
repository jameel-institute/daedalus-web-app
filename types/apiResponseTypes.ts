// Types for responses from our API endpoints.
import type { Parameter } from "./parameterTypes";

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
interface DisplayInfo {
  label: string
  value: number
  description: string | null
}
export interface Metadata {
  modelVersion: string
  parameters: Array<Parameter>
  results: Record<string, Array<DisplayInfo>>
}

export interface MetadataResponse extends ApiResponse<Metadata> { }

// Scenario
export interface NewScenarioData {
  runId: string
}

export interface NewScenarioResponse extends ApiResponse<NewScenarioData> { }

enum runStatus {
  Queued = "queued",
  Running = "running",
  Complete = "complete",
  Failed = "failed",
}

export interface ScenarioStatusData {
  done: boolean // whether the job is finished or not
  runId: string
  runErrors: Array<string> | null
  runStatus: runStatus
  runSuccess: boolean | null // null if "done" is false, otherwise indicates whether the job finished successfully
}

export interface ScenarioStatusResponse extends ApiResponse<ScenarioStatusData> { }
