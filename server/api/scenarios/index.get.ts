import prisma from "~/lib/prisma";

export default defineEventHandler(async (_event) => {
  const scenarioCount = await prisma.scenario.count();

  return {
    count: scenarioCount,
  };
});
