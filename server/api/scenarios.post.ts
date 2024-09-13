import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { NewScenarioResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const body = await readBody(event);
    const parameters = body.parameters;
    const newScenarioResponse = await runScenario(parameters, event);
    return newScenarioResponse;
  },
);
