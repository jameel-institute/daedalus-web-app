import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import type { NewScenarioResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const { parameters } = await readBody(event);

    // Delegate to runScenario so that the logic can be unit-tested.
    const newScenarioResponse = await runScenario(parameters, event);

    return newScenarioResponse;
  },
);
