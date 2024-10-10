import type { ScenarioResultResponse } from "@/types/apiResponseTypes";
import { getScenarioResult } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<ScenarioResultResponse> => {
    const runId = getRouterParam(event, "runId");
    const scenarioResultResponse = await getScenarioResult(runId, event);

    return scenarioResultResponse;
  },
);
