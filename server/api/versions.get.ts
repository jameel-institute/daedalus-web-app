import { getVersionData } from "@/server/handlers/versions";
import { defineEventHandlerWithErrors } from "@/server/utils/defineEventHandlerWithErrors";
import type { VersionDataResponse } from "@/types/daedalusApiResponseTypes";

export default defineEventHandlerWithErrors(
  // TODO: Consider cacheing this server-side https://nitro.unjs.io/guide/cache
  defineEventHandler(async (event): Promise<VersionDataResponse> => {
    // Delegate to getVersionData so that the logic can be unit-tested.
    const versionDataResponse = await getVersionData(event);

    return versionDataResponse;
  }),
);
