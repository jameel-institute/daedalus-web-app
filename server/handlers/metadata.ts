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

  const updatedResponse = {
    ...response,
    data: {
      ...response.data,
      parameters: [
        ...response.data?.parameters || [],
        {
          id: "behaviour",
          label: "Perception of risk",
          description: "The population's risk perception, which influences their protective behaviours.",
          parameterType: "select",
          ordered: true,
          options: [
            {
              id: "pessimistic",
              label: "Pessimistic",
              description: "People behave pessimistically, taking more protective actions.",
            },
            {
              id: "intermediate",
              label: "Intermediate",
              description: "People behave intermediately",
            },
            {
              id: "optimistic",
              label: "Optimistic",
              description: "People behave optimistically, taking fewer protective actions.",
            },
          ],
        },
      ].sort((a, b) => Number(a.id === "hospital_capacity") - Number(b.id === "hospital_capacity")), // Sort parameters alphabetically by label
    },
  };

  console.log("Metadata response.data:", updatedResponse.data);

  return apiResponse<Metadata>(updatedResponse) as MetadataResponse;
};
