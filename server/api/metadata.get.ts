import { getMetaData } from "@/server/handlers/metadata";
import { defineEventHandlerWithErrors } from "@/server/utils/defineEventHandlerWithErrors";
import type { MetaDataResponse } from "@/types/daedalusApiResponseTypes";

export default defineEventHandlerWithErrors(
  // TODO: Consider cacheing this server-side https://nitro.unjs.io/guide/cache
  defineEventHandler(async (event): Promise<MetaDataResponse> => {
    // Delegate to getMetaData so that the logic can be unit-tested.
    const versionDataResponse = await getMetaData(event);

    return versionDataResponse;
  }),
);
