import type { MetadataResponse } from "~/types/apiResponseTypes";
import { getMetadata } from "@/server/handlers/metadata";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<MetadataResponse> => {
    const metadataResponse = await getMetadata(event);

    return metadataResponse;
  },
);
