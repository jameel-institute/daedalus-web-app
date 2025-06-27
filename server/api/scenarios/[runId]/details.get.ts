import { getScenario } from "~/server/handlers/scenarios";

export default defineEventHandler(
  async (event) => {
    const response = await getScenario(event);

    return response;
  },
);
