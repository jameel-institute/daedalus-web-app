import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import type {
  ApiError,
  NewScenarioData,
  NewScenarioResponse,
  ScenarioResultData,
  ScenarioResultResponse,
  ScenarioStatusData,
  ScenarioStatusResponse,
} from "@/types/apiResponseTypes";
import type { ParameterDict } from "@/types/apiRequestTypes";

const rApiNewScenarioEndpoint = "/scenario/run";
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

const rApiScenarioStatusEndpoint = (runId: string) => `/scenario/status/${runId}`;
export const getScenarioStatus = async (runId: string | undefined, event?: H3Event<EventHandlerRequest>): Promise<ScenarioStatusResponse> => {
  if (!runId) {
    const errors: Array<ApiError> = [{ error: "Bad request", detail: "Run ID not provided." }];
    return {
      statusText: "Bad request",
      statusCode: 400,
      errors,
      data: null,
    } as ScenarioStatusResponse;
  }

  const response = await fetchRApi<ScenarioStatusData>(
    rApiScenarioStatusEndpoint(runId),
    {
      method: "GET",
    },
    event,
  );

  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data: response?.data as ScenarioStatusData,
  } as ScenarioStatusResponse;
};

const rApiScenarioResultEndpoint = (runId: string) => `/scenario/results/${runId}`;
export const getScenarioResult = async (runId: string | undefined, event?: H3Event<EventHandlerRequest>): Promise<ScenarioResultResponse> => {
  if (!runId) {
    const errors: Array<ApiError> = [{ error: "Bad request", detail: "Run ID not provided." }];
    return {
      statusText: "Bad request",
      statusCode: 400,
      errors,
      data: null,
    } as ScenarioResultResponse;
  }

  const response = await fetchRApi<ScenarioResultData>(
    rApiScenarioResultEndpoint(runId),
    {
      method: "GET",
    },
    event,
  );

  return {
    statusText: response.statusText,
    statusCode: response.statusCode,
    errors: response?.errors || null,
    data: response?.data as ScenarioResultData,
  } as ScenarioResultResponse;
};
