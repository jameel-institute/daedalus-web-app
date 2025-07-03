import prisma from "~/server/db/prisma";
import { getScenario } from "@/server/handlers/scenarios";

vi.mock("~/server/db/prisma", () => ({
  default: {
    scenario: {
      findUnique: vi.fn(),
    },
  },
}));

describe("requesting a scenario status", () => {
  describe("when a run ID is not provided", () => {
    it("should throw an error (which will trigger a 400 'bad request' response)", async () => {
      await expect(() => getScenario(undefined)).rejects.toThrowError(
        "Run ID not provided.",
      );
    });
  });

  describe("when the scenario is not found", () => {
    it("should throw an error (which will trigger a 404 'not found' response)", async () => {
      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => null);

      await expect(() => getScenario("123")).rejects.toThrowError(
        "Scenario with ID '123' not found",
      );
      expect(spy).toHaveBeenCalledWith({
        where: { run_id: "123" },
      });
    });
  });

  describe("when the scenario is found", () => {
    it("should return the scenario data", async () => {
      const parameters = { param1: "value1" };
      const scenario = {
        parameters,
        run_id: "123",
      };

      const spy = vi.spyOn(prisma.scenario, "findUnique");
      spy.mockImplementation(async () => scenario);

      const response = await getScenario("123");

      expect(spy).toHaveBeenCalledWith({
        where: { run_id: "123" },
      });
      expect(response).toEqual({
        parameters,
        runId: "123",
      });
    });
  });
});
