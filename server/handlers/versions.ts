import type { VersionData, VersionDataResponse } from "~/types/apiResponseTypes";
import type { EventHandlerRequest, H3Event } from "h3";
import packageJson from "@/package.json";
import { fetchRApi } from "@/server/utils/rApi";
import { apiResponse } from "../utils/responseHelpers";

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

  return apiResponse<VersionData>({
    ...response,
    data,
  }) as VersionDataResponse;
};
