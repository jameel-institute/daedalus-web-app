import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import type { NewScenarioResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const body = await readBody(event);
    const parameters = typeof body === "object" ? body.parameters : JSON.parse(body).parameters; // Comes through as a string in the integration tests.
    const newScenarioResponse = await runScenario(parameters, event);
    return newScenarioResponse;
  },
);
