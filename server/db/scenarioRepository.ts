import type { scenario } from "@prisma/client";
import prisma from "~/server/db/prisma";
import type { ParameterSet } from "~/types/parameterTypes";

export const getScenarioByParametersHash = async (parametersHash: string): Promise<scenario | null> => {
  return await prisma.scenario.findUnique({
    where: {
      parameters_hash: parametersHash,
    },
  });
};

export const getScenarioByRunId = async (runId?: string): Promise<scenario | null | undefined> => {
  if (!runId) {
    return;
  }

  return await prisma.scenario.findUnique({
    where: {
      run_id: runId,
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

export const createScenario = async (parameters: ParameterSet, parametersHash: string, runId: string) => {
  if (Object.keys(parameters).length === 0) {
    throw new Error("Parameters cannot be empty");
  }

  await prisma.scenario.create({
    data: {
      parameters,
      parameters_hash: parametersHash,
      run_id: runId,
    },
  });
};
