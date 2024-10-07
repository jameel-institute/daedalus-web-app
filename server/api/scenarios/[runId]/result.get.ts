import { getScenarioResult } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { ScenarioResultResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<ScenarioResultResponse> => {
    const runId = getRouterParam(event, "runId");
    const scenarioResultResponse = await getScenarioResult(runId, event);

    return scenarioResultResponse;
  },
);
