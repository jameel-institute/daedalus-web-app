import type { Metadata, MetadataResponse } from "~/types/apiResponseTypes";
import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import { apiResponse } from "../utils/responseHelpers";

const rApiMetadataEndpoint = "/metadata";

export const getMetadata = async (event?: H3Event<EventHandlerRequest>): Promise<MetadataResponse> => {
  const response = await fetchRApi<Metadata>( // Since we aren't transforming the R API's response, we can re-use the type interface for the web app's response (Metadata) as the interface for the R API's response.
    rApiMetadataEndpoint,
    {},
    event,
  );

  return apiResponse<Metadata>(response) as MetadataResponse;
};
