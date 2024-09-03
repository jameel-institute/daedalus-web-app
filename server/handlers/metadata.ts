import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import type { MetaData, MetaDataResponse } from "@/types/apiResponseTypes";

const rApiMetadataEndpoint = "/metadata";

export const getMetaData = async (event?: H3Event<EventHandlerRequest>): Promise<MetaDataResponse> => {
  const response = await fetchRApi<MetaData>( // Since we aren't transforming the R API's response, we can re-use the type interface for the web app's response (MetaData) as the interface for the R API's response.
    rApiMetadataEndpoint,
    {},
    event,
  );

  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data: response?.data as MetaData,
  } as MetaDataResponse;
};
