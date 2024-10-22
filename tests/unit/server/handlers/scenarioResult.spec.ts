import { getScenarioResult } from "@/server/handlers/scenarios";
import { registerEndpoint } from "@nuxt/test-utils/runtime";

const mockedScenarioResultResponse = vi.fn();
const runId = "abcd125f555a69b376cf08eba800289e4a133234";
const sampleResults = {
  runId,
  parameters: { param1: "value1" },
  costs: [{ cost1: 1 }],
  capacities: [{ capacity1: 1 }],
  interventions: [{ intervention1: "light" }],
  time_series: { series1: [0, 1, 2] },
};

registerEndpoint(`/scenario/results/${runId}`, {
  method: "GET",
  handler: mockedScenarioResultResponse,
});

describe("requesting a scenario status", () => {
  describe("when a run ID is not provided", () => {
    it("should return a 'Bad request' response", async () => {
      const response = await getScenarioResult(undefined);

      expect(response.data).toBeNull();
      expect(response.errors).toEqual([{ error: "Bad request", detail: "Run ID not provided." }]);
      expect(response.statusCode).toBe(400);
      expect(response.statusText).toBe("Bad request");
    });
  });

  describe("when the R API response itself is successful", () => {
    it("should return the result response data", async () => {
      mockedScenarioResultResponse.mockImplementation(() => {
        return {
          status: "success",
          errors: null,
          data: sampleResults,
        };
      });

      const response = await getScenarioResult(runId);

      expect(response.data).toEqual(sampleResults);
      expect(response.errors).toBeNull();
      expect(response.statusCode).toBe(200);
      expect(response.statusText).toBe("");
    });
  });

  describe("when the R API response itself is unsuccessful", () => {
    it("passes on the status code and message", async () => {
      mockedScenarioResultResponse.mockImplementation(() => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await getScenarioResult(runId);

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
