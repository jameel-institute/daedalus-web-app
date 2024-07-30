import type { RApiResponse } from "./utils/useRApi";
import { useRApi } from "./utils/useRApi";

interface VersionDataResponse extends RApiResponse {
  data: {
    "daedalus": string
    "daedalus.api": string
  } | null
}

const versionEndpoint = "/";

export function useVersionData() {
  const response = useRApi<VersionDataResponse>(versionEndpoint);

  return {
    versionFetchStatus: response.fetchStatus,
    refreshVersionFetch: response.refresh,
    versionFetchError: response.error,
    versionData: response.responseData,
  };
}
