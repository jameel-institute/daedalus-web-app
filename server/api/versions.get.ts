import { getVersionData } from "@/server/handlers/versions";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { VersionDataResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<VersionDataResponse> => {
    const versionDataResponse = await getVersionData(event);

    return versionDataResponse;
  },
);
