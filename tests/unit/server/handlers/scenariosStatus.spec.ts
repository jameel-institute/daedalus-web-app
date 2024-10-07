import { describe, expect, it, vi } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { getScenarioStatus } from "@/server/handlers/scenarios";

const mockedScenarioStatusResponse = vi.fn();
const runId = "abcd125f555a69b376cf08eba800289e4a133234";

registerEndpoint(`/scenario/status/${runId}`, {
  method: "GET",
  handler: mockedScenarioStatusResponse,
});

describe("requesting a scenario status", () => {
  describe("when a run ID is not provided", () => {
    it("should return a 'Bad request' response", async () => {
      const response = await getScenarioStatus(undefined);

      expect(response.data).toBeNull();
      expect(response.errors).toEqual([{ error: "Bad request", detail: "Run ID not provided." }]);
      expect(response.statusCode).toBe(400);
      expect(response.statusText).toBe("Bad request");
    });
  });

  describe("when the R API response itself is successful", () => {
    it("should return the status response data", async () => {
      mockedScenarioStatusResponse.mockImplementation(() => {
        return {
          status: "success",
          errors: null,
          data: {
            runStatus: "queued",
            runSuccess: null,
            done: false,
            runErrors: null,
            runId,
          },
        };
      });

      const response = await getScenarioStatus(runId);

      expect(response.data).toEqual({
        runStatus: "queued",
        runSuccess: null,
        done: false,
        runErrors: null,
        runId,
      });
      expect(response.errors).toBeNull();
      expect(response.statusCode).toBe(200);
      expect(response.statusText).toBe("");
    });
  });

  describe("when the R API response itself is unsuccessful", () => {
    it("passes on the status code and message", async () => {
      mockedScenarioStatusResponse.mockImplementation(() => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await getScenarioStatus(runId);

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
