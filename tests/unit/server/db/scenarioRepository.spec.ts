import prisma from "~/server/db/prisma";
import { createScenario, deleteScenario, getScenarioByParametersHash, getScenarioByRunId } from "~/server/db/scenarioRepository";

vi.mock("~/server/db/prisma", () => ({
  default: {
    scenario: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("scenarioRepository", () => {
  const parameters = {
    param1: "value1",
    param2: "value2",
  };
  const parametersHash = "test-hash";
  const runId = "test-run-id";
  const scenario = {
    id: "1",
    parameters,
    parameters_hash: parametersHash,
    run_id: runId,
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe("getScenarioByParametersHash", () => {
    it("should look up a single scenario by its parameter hash", async () => {
      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => scenario);

      const result = await getScenarioByParametersHash(parametersHash);

      expect(spy).toHaveBeenCalledWith({
        where: { parameters_hash: parametersHash },
      });
      expect(result).toEqual(scenario);
    });

    it("should return null when no such scenario exists", async () => {
      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => null);

      const result = await getScenarioByParametersHash(parametersHash);

      expect(spy).toHaveBeenCalledWith({
        where: { parameters_hash: parametersHash },
      });
      expect(result).toEqual(null);
    });
  });

  describe("getScenarioByRunId", () => {
    it("should look up a single scenario by its run id", async () => {
      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => scenario);

      const result = await getScenarioByRunId(runId);

      expect(spy).toHaveBeenCalledWith({
        where: { run_id: runId },
      });
      expect(result).toEqual(scenario);
    });

    it("should return null when no such scenario exists", async () => {
      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => null);

      const result = await getScenarioByRunId(runId);

      expect(spy).toHaveBeenCalledWith({
        where: { run_id: runId },
      });
      expect(result).toEqual(null);
    });
  });

  describe("deleteScenario", () => {
    it("should delete the scenario", async () => {
      await deleteScenario(scenario);

      expect(prisma.scenario.delete).toHaveBeenCalledWith({
        where: { id: scenario.id },
      });
    });
  });

  describe("createScenario", () => {
    it("should create a new scenario", async () => {
      await createScenario(parameters, parametersHash, runId);

      expect(prisma.scenario.create).toHaveBeenCalledWith({
        data: {
          parameters,
          parameters_hash: parametersHash,
          run_id: runId,
        },
      });
    });

    it("should throw an error if parameters are empty", async () => {
      await expect(createScenario({}, "empty-hash", runId)).rejects.toThrow("Parameters cannot be empty");
    });
  });
});
