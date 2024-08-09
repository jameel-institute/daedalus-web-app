import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import packageJson from "@/package.json";
import type { VersionData, VersionDataResponse } from "@/types/daedalusApiResponseTypes";

const rApiVersionEndpoint = "/";

export const getVersionData = async (event?: H3Event<EventHandlerRequest>): Promise<VersionDataResponse> => {
  let data: VersionData | null = null;

  const response = await fetchRApi<{
    "daedalus": string
    "daedalus.api": string
  }>(rApiVersionEndpoint, {}, event);

  if (response?.data) {
    data = {
      daedalusModel: response.data.daedalus,
      daedalusApi: response.data["daedalus.api"],
      daedalusWebApp: packageJson.version,
    } as VersionData;
  }

  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data,
  } as VersionDataResponse;
};
