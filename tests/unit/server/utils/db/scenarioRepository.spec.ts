import prisma from "~/server/utils/db/prisma";
import { createScenario, deleteScenario, getScenarioByParametersHash } from "~/server/utils/db/scenarioRepository";

vi.mock("~/server/utils/db/prisma", () => ({
  default: {
    scenario: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("scenarioRepository", () => {
  const parametersHash = "test-hash";
  const runId = "test-run-id";
  const scenario = { id: "1", parameters_hash: parametersHash, run_id: runId, created_at: new Date(), updated_at: new Date() };

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
      await createScenario(parametersHash, runId);

      expect(prisma.scenario.create).toHaveBeenCalledWith({
        data: {
          parameters_hash: parametersHash,
          run_id: runId,
        },
      });
    });
  });
});
