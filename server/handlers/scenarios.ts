import type { ParameterDict } from "@/types/apiRequestTypes";
import type {
  ApiError,
  NewScenarioData,
  NewScenarioResponse,
  ScenarioResultData,
  ScenarioResultResponse,
  ScenarioStatusData,
  ScenarioStatusResponse,
} from "@/types/apiResponseTypes";
import type { EventHandlerRequest, H3Event } from "h3";
import { fetchRApi } from "@/server/utils/rApi";
import { getModelVersion, hashParameters } from "../utils/helpers";
import { apiResponse, badRequestResponse, internalServerErrorResponse } from "../utils/responseHelpers";
import { createScenario, deleteScenario, getScenarioByParametersHash } from "../db/scenarioRepository";

const rApiRunScenarioEndpoint = "/scenario/run";
const runScenario = async (
  parameters: ParameterDict,
  version: string,
  event?: H3Event<EventHandlerRequest>,
): Promise<NewScenarioResponse> => {
  const response = await fetchRApi<NewScenarioData>( // Since we aren't transforming the R API's response, we can re-use the type interface for the web app's response (NewScenarioData) as the interface for the R API's response.
    rApiRunScenarioEndpoint,
    {
      method: "POST",
      body: {
        modelVersion: version,
        parameters,
      },
    },
    event,
  );

  return apiResponse<NewScenarioData>(response) as NewScenarioResponse;
};

const rApiScenarioStatusEndpoint = (runId: string) => `/scenario/status/${runId}`;
export const getScenarioStatus = async (
  runId: string | undefined,
  event?: H3Event<EventHandlerRequest>,
): Promise<ScenarioStatusResponse> => {
  if (!runId) {
    const errors: Array<ApiError> = [{ error: "Bad request", detail: "Run ID not provided." }];
    return badRequestResponse(errors) as ScenarioStatusResponse;
  }

  const response = await fetchRApi<ScenarioStatusData>(
    rApiScenarioStatusEndpoint(runId),
    {
      method: "GET",
    },
    event,
  );

  return apiResponse<ScenarioStatusData>(response) as ScenarioStatusResponse;
};

const rApiScenarioResultEndpoint = (runId: string) => `/scenario/results/${runId}`;
export const getScenarioResult = async (
  runId: string | undefined,
  event?: H3Event<EventHandlerRequest>,
): Promise<ScenarioResultResponse> => {
  if (!runId) {
    const errors: Array<ApiError> = [{ error: "Bad request", detail: "Run ID not provided." }];
    return badRequestResponse(errors) as ScenarioResultResponse;
  }

  const response = await fetchRApi<ScenarioResultData>(
    rApiScenarioResultEndpoint(runId),
    {
      method: "GET",
    },
    event,
  );

  return apiResponse<ScenarioResultData>(response) as ScenarioResultResponse;
};

// Look up the scenario in the db, by a hash of the parameters.
// If it exists, this scenario has already been run, so we can skip running it and return the run ID.
// If it doesn't exist, run the scenario, and return the run ID.
// Run ID will be used to look up the scenario status and results later.
export const newScenario = async (
  parameters: ParameterDict,
  event?: H3Event<EventHandlerRequest>,
): Promise<NewScenarioResponse> => {
  const version = await getModelVersion();

  if (!version) {
    const errors: Array<ApiError> = [{ error: "Internal server error", detail: "Model version lookup failed." }];
    return internalServerErrorResponse(errors) as NewScenarioResponse;
  }
  const parametersHash = hashParameters(parameters, version);
  const scenario = await getScenarioByParametersHash(parametersHash);

  if (scenario) {
    // Validate that the run ID returned by the db is one the R API recognises.
    const scenarioStatus = await getScenarioStatus(scenario.run_id, event);
    if (scenarioStatus.statusCode === 200 && scenarioStatus.errors === null) {
      return apiResponse<NewScenarioData>({
        ...scenarioStatus,
        data: { runId: scenario.run_id },
      }) as NewScenarioResponse;
    } else {
      await deleteScenario(scenario);
    }
  }

  const response = await runScenario(parameters, version, event);

  if (response?.data?.runId) {
    await createScenario(parametersHash, response.data.runId);
  }

  return apiResponse<NewScenarioData>(response) as NewScenarioResponse;
};
