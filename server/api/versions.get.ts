import { getVersionData } from "@/server/handlers/versions";
import { errorMessage } from "@/server/utils/helpers";
import type { VersionData } from "@/types/apiResponseTypes";

export default defineEventHandler(async (event): Promise<VersionData> => {
  // Delegate to handler function getVersionData so that the logic can be unit-tested.
  const versionDataResponse = await getVersionData(event);

  if (versionDataResponse.errors || !versionDataResponse.data) {
    throw createError({
      statusCode: versionDataResponse.statusCode,
      statusMessage: versionDataResponse.statusText,
      message: errorMessage(versionDataResponse.errors),
      data: versionDataResponse.errors,
    });
  } else {
    return versionDataResponse.data;
  }
});
