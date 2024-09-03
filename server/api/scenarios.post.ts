import { defineRApiEventHandler } from "~/server/utils/defineRApiEventHandler";
import { NewScenarioResponse } from "@/types/daedalusApiResponseTypes";

export default defineRApiEventHandler(
  async (event): Promise<NewScenarioResponse> => {
    // Delegate to getMetaData so that the logic can be unit-tested.
    const newScenarioResponse = await runScenario(event);

    return newScenarioResponse;
  },
  // Send a request to the R API for a job run.
  // Do the equivalent of:
  // curl -H "Content-Type: application/json" -d '{"modelVersion": "0.0.1", "parameters": {}}' http://localhost:8001/scenario/run



  // Then we redirect the user to the result page for the scenario record, at /scenarios/[id].
});






