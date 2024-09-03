import { getVersionData } from "@/server/handlers/versions";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { VersionDataResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<VersionDataResponse> => {
    // Delegate to getVersionData so that the logic can be unit-tested.
    const versionDataResponse = await getVersionData(event);

    return versionDataResponse;
  },
);
