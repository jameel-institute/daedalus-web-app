import type { NewScenarioResponse } from "@/types/apiResponseTypes";
import { newScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const body = await readBody(event);
    const parameters = body.parameters;
    const newScenarioResponse = await newScenario(parameters, event);
    return newScenarioResponse;
  },
);
