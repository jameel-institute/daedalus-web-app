// Types for responses from our API endpoints.

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
export interface ParameterOption {
  id: string
  label: string
}

export enum ParameterType {
  Select = "select",
  GlobeSelect = "globeSelect",
  Numeric = "numeric",
}
export interface Parameter {
  id: string
  label: string
  parameterType: ParameterType
  defaultOption: string | null
  ordered: boolean
  options: Array<ParameterOption>
}
export interface Metadata {
  modelVersion: string
  parameters: Array<Parameter>
}

export interface MetadataResponse extends ApiResponse<Metadata> { }

// Scenario
export interface NewScenarioData {
  runId: string
}

export interface NewScenarioResponse extends ApiResponse<NewScenarioData> { }
