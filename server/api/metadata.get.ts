import { getMetadata } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import type { MetadataResponse } from "@/types/daedalusApiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<MetadataResponse> => {
    // Delegate to getMetadata so that the logic can be unit-tested.
    const metadataResponse = await getMetadata(event);

    return metadataResponse;
  },
);
