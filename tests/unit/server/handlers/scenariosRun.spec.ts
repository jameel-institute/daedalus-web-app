import { runScenario } from "@/server/handlers/scenarios";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";
import { describe, expect, it, vi } from "vitest";

const mockedRunScenarioResponse = vi.fn();

registerEndpoint("/scenario/run", {
  method: "POST",
  handler: mockedRunScenarioResponse,
});

describe("requesting a scenario analysis to be run by the R API", () => {
  describe("when the R API response is successful", () => {
    it("should forward the parameters to the R API, and return the run id", async () => {
      mockedRunScenarioResponse.mockImplementation(async (event) => {
        const body = await readBody(event);

        if (body.parameters.disease === "mpox" && body.modelVersion === "0.0.1") {
          return {
            status: "success",
            errors: null,
            data: {
              runId: "abcd1234",
            },
          };
        }

        throw new Error("The test failed to pass the correct parameters to the R API.");
      });

      const response = await runScenario({ disease: "mpox" });

      expect(response.data).toEqual({
        runId: "abcd1234",
      });
      expect(response.errors).toBeNull();
      expect(response.statusCode).toBe(200);
      expect(response.statusText).toBe("");
    });
  });

  describe("when the R API response is unsuccessful", () => {
    it("passes on the status code and message", async () => {
      mockedRunScenarioResponse.mockImplementation(() => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await runScenario({ disease: "mpox" });

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
