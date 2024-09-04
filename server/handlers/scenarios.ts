import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import type { NewScenarioData, NewScenarioResponse } from "@/types/apiResponseTypes";
import type { ParameterDict } from "@/types/apiRequestTypes";

const rApiNewScenarioEndpoint = "/scenario/run";

// Send a request to the R API for a job run.
export const runScenario = async (parameters: ParameterDict, event?: H3Event<EventHandlerRequest>): Promise<NewScenarioResponse> => {
  const response = await fetchRApi<NewScenarioData>( // Since we aren't transforming the R API's response, we can re-use the type interface for the web app's response (NewScenarioData) as the interface for the R API's response.
    rApiNewScenarioEndpoint,
    {
      method: "POST",
      body: {
        modelVersion: "0.0.1", // TODO: Make this not hard-coded.
        parameters,
      },
    },
    event,
  );

  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data: response?.data as NewScenarioData,
  } as NewScenarioResponse;
};
