export const rApiAddress = "http://localhost:8001";
export const versionEndpoint = "/";

interface RApiError {
  error: string
  detail: string
}

interface RApiResponse {
  status: string
  errors: Array<RApiError> | null
  data: object | null
}

interface VersionDataResponse extends RApiResponse {
  data: {
    "daedalus": string
    "daedalus.api": string
  }
}

export async function getVersionData(): Promise<VersionDataResponse> {
  const { data: versionResponseData } = await useFetch<VersionDataResponse>(rApiAddress + versionEndpoint);

  if (!versionResponseData.value) {
    throw new Error("Failed to fetch version data");
  }

  return versionResponseData.value;
}
