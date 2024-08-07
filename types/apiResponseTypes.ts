// Types for responses from our API endpoints.

export interface ApiError {
  error: string
  detail: string
}

interface ServerApiResponse<T extends object> {
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

export interface VersionDataResponse extends ServerApiResponse<VersionData> { }
