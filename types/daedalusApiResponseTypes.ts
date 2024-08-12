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

export interface VersionData {
  daedalusModel: string
  daedalusApi: string
  daedalusWebApp: string
}

export interface VersionDataResponse extends ApiResponse<VersionData> { }
