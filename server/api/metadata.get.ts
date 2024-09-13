import { getMetadata } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import type { MetadataResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<MetadataResponse> => {
    const metadataResponse = await getMetadata(event);

    return metadataResponse;
  },
);
