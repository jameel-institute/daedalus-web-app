import { getScenario } from "~/server/handlers/scenarios";

export default defineEventHandler(
  async (event) => {
    const runId = getRouterParam(event, "runId");
    const response = await getScenario(runId);

    return response;
  },
);
