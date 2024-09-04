import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import type { NewScenarioResponse } from "@/types/apiResponseTypes";
import type { ParameterDict } from "@/types/apiRequestTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const query = getQuery(event);

    const modelParameters = JSON.parse(query.parameters as string) as ParameterDict;

    // Delegate to runScenario so that the logic can be unit-tested.
    const newScenarioResponse = await runScenario(modelParameters, event);

    return newScenarioResponse;
  },
);
