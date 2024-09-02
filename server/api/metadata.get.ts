import { getMetaData } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import type { MetaDataResponse } from "@/types/daedalusApiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<MetaDataResponse> => {
    // Delegate to getMetaData so that the logic can be unit-tested.
    const metaDataResponse = await getMetaData(event);

    return metaDataResponse;
  },
  { maxAge: 60 },
);
