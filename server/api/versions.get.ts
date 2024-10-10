import type { VersionDataResponse } from "@/types/apiResponseTypes";
import { getVersionData } from "@/server/handlers/versions";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<VersionDataResponse> => {
    const versionDataResponse = await getVersionData(event);

    return versionDataResponse;
  },
);
