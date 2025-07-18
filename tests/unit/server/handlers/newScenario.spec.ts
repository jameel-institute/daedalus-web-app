import { newScenario } from "@/server/handlers/scenarios";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";

import prisma from "~/server/db/prisma";

const runId = "abcd1234";
const expectedParametersHash = "238121603a2142de5957d81d3c836272915a5e9828fe5d3c0422d9653ae89472";

const mockedRunScenarioResponse = vi.fn();
const mockedScenarioStatusResponse = vi.fn();

// Mocking the responses from the R API.
registerEndpoint("/scenario/run", {
  method: "POST",
  handler: mockedRunScenarioResponse,
});
registerEndpoint(`/scenario/status/${runId}`, {
  method: "GET",
  handler: mockedScenarioStatusResponse,
});

vi.mock("~/server/db/prisma", () => ({
  default: {
    scenario: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: () => ({
        run_id: runId,
      }),
    },
  },
}));

vi.mock("@/server/handlers/versions", () => ({
  getVersionData: () => ({
    data: {
      daedalusApi: "0.0.0",
      daedalusModel: "3.2.1",
      daedalusWebApp: "0.0.0",
    },
  }),
}));

describe("requesting a scenario analysis to be run by the R API", () => {
  describe("when there is no existing scenario in the database", () => {
    describe("when the R API response to a run request is successful", () => {
      it("should forward the parameters to the R API to run the analysis, create a db record, and return the run id", async () => {
        mockedRunScenarioResponse.mockImplementation(async (event) => {
          const body = await readBody(event);

          if (body.parameters.disease === "mpox" && body.modelVersion === "3.2.1") {
            return {
              status: "success",
              errors: null,
              data: {
                runId,
              },
            };
          }

          throw new Error("The test failed to pass the correct parameters to the R API.");
        });

        const scenarioCreateSpy = vi.spyOn(prisma.scenario, "create");
        const scenarioDeleteSpy = vi.spyOn(prisma.scenario, "delete");
        const scenarioFindUniqueSpy = vi.spyOn(prisma.scenario, "findUnique");
        scenarioFindUniqueSpy.mockImplementation(() => undefined);

        const response = await newScenario({ disease: "mpox" });

        expect(response.data).toEqual({
          runId,
        });
        expect(response.errors).toBeNull();
        expect(response.statusCode).toBe(200);
        expect(response.statusText).toBe("");

        expect(scenarioCreateSpy).toHaveBeenCalledWith({
          data: {
            parameters_hash: expectedParametersHash,
            parameters: {
              disease: "mpox",
            },
            run_id: runId,
          },
        });
        expect(scenarioDeleteSpy).not.toHaveBeenCalled();
      });
    });

    describe("when the R API response to a run request is unsuccessful", () => {
      it("passes on the status code and message", async () => {
        mockedRunScenarioResponse.mockImplementation(() => {
          throw createError({
            statusCode: 418,
            statusMessage: "I'm a teapot",
          });
        });

        const scenarioCreateSpy = vi.spyOn(prisma.scenario, "create");
        const scenarioDeleteSpy = vi.spyOn(prisma.scenario, "delete");
        const scenarioFindUniqueSpy = vi.spyOn(prisma.scenario, "findUnique");
        scenarioFindUniqueSpy.mockImplementation(() => undefined);

        const response = await newScenario({ disease: "mpox" });

        expect(response.data).toBeNull();
        expect(response.statusCode).toBe(418);
        expect(response.statusText).toBe("I'm a teapot");
        expect(scenarioCreateSpy).not.toHaveBeenCalled();
        expect(scenarioDeleteSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("when there is an existing scenario in the database that matches the parameters provided", () => {
    describe("when the R API status endpoint recognises the run id of the existing scenario", () => {
      it("should return the run id of the existing scenario without re-running the analysis", async () => {
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

        const scenarioCreateSpy = vi.spyOn(prisma.scenario, "create");
        const scenarioDeleteSpy = vi.spyOn(prisma.scenario, "delete");

        const response = await newScenario({ disease: "mpox" });

        expect(response.data).toEqual({
          runId,
        });
        expect(response.errors).toBeNull();
        expect(response.statusCode).toBe(200);
        expect(response.statusText).toBe("");

        expect(scenarioCreateSpy).not.toHaveBeenCalled();
        expect(scenarioDeleteSpy).not.toHaveBeenCalled();
        expect(mockedRunScenarioResponse).not.toHaveBeenCalled();
      });
    });

    describe("when the R API status endpoint does not recognise the run id of the existing scenario", () => {
      it("should delete the existing scenario, forward the parameters to the R API to run the analysis, and return the run id", async () => {
        mockedRunScenarioResponse.mockImplementation(async (event) => {
          const body = await readBody(event);

          if (body.parameters.disease === "mpox" && body.modelVersion === "3.2.1") {
            return {
              status: "success",
              errors: null,
              data: {
                runId,
              },
            };
          }

          throw new Error("The test failed to pass the correct parameters to the R API.");
        });
        mockedScenarioStatusResponse.mockImplementation(async () => {
          throw createError({
            statusCode: 404,
            statusMessage: "Scenario not found",
          });
        });

        const scenarioCreateSpy = vi.spyOn(prisma.scenario, "create");
        const scenarioDeleteSpy = vi.spyOn(prisma.scenario, "delete");

        const response = await newScenario({ disease: "mpox" });

        expect(response.data).toEqual({
          runId,
        });
        expect(response.errors).toBeNull();
        expect(response.statusCode).toBe(200);
        expect(response.statusText).toBe("");

        expect(scenarioCreateSpy).toHaveBeenCalledWith({
          data: {
            parameters_hash: expectedParametersHash,
            parameters: {
              disease: "mpox",
            },
            run_id: runId,
          },
        });
        expect(scenarioDeleteSpy).toHaveBeenCalled();
      });
    });
  });
});
