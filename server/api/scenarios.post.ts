import { runScenario } from "@/server/handlers/scenarios";
import { defineRApiEventHandler } from "@/server/utils/defineRApiEventHandler";
import { formDataToObject } from "@/server/utils/helpers";
import type { NewScenarioResponse } from "@/types/apiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    const formDataBody = await readFormData(event);
    const newScenarioResponse = await runScenario(formDataToObject(formDataBody), event);
    return newScenarioResponse;
  },
);
