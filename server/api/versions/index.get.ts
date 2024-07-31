import { fetchRApi } from "@/server/utils/rApi";
import type { RApiResponse } from "@/server/utils/rApi";
import packageJson from "@/package.json";

const rApiVersionEndpoint = "/";

interface VersionDataResponse extends RApiResponse {
  data: {
    "daedalus": string
    "daedalus.api": string
  } | null
}

interface SuccessResponse {
  daedalusModel: string
  daedalusApi: string
  daedalusWebApp: string
}

export default defineCachedEventHandler(async (event): Promise<SuccessResponse> => {
  const response = await fetchRApi<VersionDataResponse>(rApiVersionEndpoint, {}, event);

  return {
    daedalusModel: response!.data!.daedalus,
    daedalusApi: response!.data!["daedalus.api"],
    daedalusWebApp: packageJson.version,
  };
}, { maxAge: 60 /* Cache response server-side for 1 minute */ }); // https://nitro.unjs.io/guide/cache
