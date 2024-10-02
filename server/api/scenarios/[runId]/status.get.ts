import { getScenarioStatus } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { ScenarioStatusResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<ScenarioStatusResponse> => {
    const runId = getRouterParam(event, "runId");
    const scenarioStatusResponse = await getScenarioStatus(runId, event);

    return scenarioStatusResponse;
  },
);
