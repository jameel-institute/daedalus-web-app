import type { scenario } from "@prisma/client";
import prisma from "~/lib/prisma";

export const getScenarioByParametersHash = async (parametersHash: string): Promise<scenario | null> => {
  return await prisma.scenario.findUnique({
    where: {
      parameters_hash: parametersHash,
    },
  });
};

export const deleteScenario = async (scenario: scenario) => {
  await prisma.scenario.delete({
    where: {
      id: scenario.id,
    },
  });
};

export const createScenario = async (parametersHash: string, runId: string) => {
  await prisma.scenario.create({
    data: {
      parameters_hash: parametersHash,
      run_id: runId,
    },
  });
};
