import type { NewScenarioResponse } from "@/types/apiResponseTypes";
import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const body = await readBody(event);
    const parameters = body.parameters;
    const newScenarioResponse = await runScenario(parameters, event);
    return newScenarioResponse;
  },
);
