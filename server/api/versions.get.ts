import { getVersionData } from "@/server/handlers/versions";
import { defineEventHandlerWithErrors } from "@/server/utils/defineEventHandlerWithErrors";
import type { VersionDataResponse } from "@/types/daedalusApiResponseTypes";

export default defineEventHandlerWithErrors(
  // TODO: Consider cacheing this server-side https://nitro.unjs.io/guide/cache
  defineEventHandler({
    onBeforeResponse: async (event) => {
      console.warn("This is one possible way of hooking into a request. If desired these can be applied globally (in theory, but might be hard since I don't explicitly call createApp): https://h3.unjs.io/guide/app#setting-global-hooks")
    },
    // onRequest,
    // onError,
    // onAfterResponse,
    handler: async (event): Promise<VersionDataResponse> => {
      // Delegate to getVersionData so that the logic can be unit-tested.
      const versionDataResponse = await getVersionData(event);

      console.warn("Did it come through?");
      console.warn(event.context.sessionId);
      console.warn(event.context)

      return versionDataResponse;
    },
  }),
);
