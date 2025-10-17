// @vitest-environment node

// For background on how and why this test is set up the way it is, see
// tests/integration/README.md.

// Import the 'fetch' documented at the below URL as 'nuxtTestUtilsFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import type { scenario } from "@prisma/client";
import dotenv from "dotenv";
import prisma from "~/server/db/prisma";

const nodeFetch = fetch; // Normal 'fetch' from Node

const env = dotenv.config().parsed;
let rApiBaseUrl = env!.NUXT_R_API_BASE;
rApiBaseUrl = rApiBaseUrl.endsWith("/") ? rApiBaseUrl.slice(0, -1) : rApiBaseUrl;

// Send a request to 'purge' Mockoon, i.e. reset it to its initial state,
// so that responses configured to be sequential will start from the first response.
// https://mockoon.com/docs/latest/admin-api/server-state/
const purgeRApiMockServer = async () => {
  const purgeResponse = await nodeFetch(`${rApiBaseUrl}/mockoon-admin/state/purge`, { method: "POST" });
  expect(purgeResponse?.status).toBe(200);
};

// We configure mockoon to return different responses for the same request, sequentially:
// https://mockoon.com/docs/latest/route-responses/multiple-responses/#sequential-route-response
describe("endpoints which consume the R API", { sequential: true }, async () => {
  beforeAll(async () => {
    // Verify that the user of the test suite has started the mock server
    // by checking that the server is listening on localhost:8001/mock-smoke

    let response;
    try {
      response = await nodeFetch(`${rApiBaseUrl}/mock-smoke`); // Use Node's fetch so that we can set a different base URL with port 8001.
    } catch {
      if (response?.status !== 200) {
        process.stdout.write("The mock server couldn't be found. Please run `npx mockoon-cli start --data ./tests/unit/mocks/mockoon.json` or use the Mockoon desktop app.");
      }
    }

    // A failure, in order to exit the test if no mock server.
    expect(response?.status).toBe(200);

    await purgeRApiMockServer();
  });

  afterEach(async () => {
    await prisma.scenario.deleteMany({});
  });

  await setup(); // Start the Nuxt server

  describe("api/versions", async () => {
    it("returns a successful response when the mock server responds successfully", async () => {
      const response = await nuxtTestUtilsFetch("/api/versions");

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.daedalusModel).toBe("1.2.3.4.5.6.7.8");
      expect(json.daedalusApi).toBe("8.7.6.5.4.3.2.1");
      expect(json.daedalusWebApp).toMatch(/(\d+\.)?(\d+\.)?(\*|\d+)/);
    });

    it("returns a response with informative errors when the mock server responds with an error", async () => {
      const response = await nuxtTestUtilsFetch("/api/versions");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("Not Found");
      const json = await response.json();
      expect(json.data[0].error).toBe("NOT_FOUND");
      expect(json.data[0].detail).toBe("Resource not found");
      expect(json.message).toBe("NOT_FOUND: Resource not found"); // A concatenation of the error details from the R API.
    });

    it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
      // https://mockoon.com/tutorials/getting-started/#step-5-add-a-delay-to-the-response

      const response = await nuxtTestUtilsFetch("/api/versions");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("error");

      const json = await response.json();
      expect(json.message).toBe("Unknown error: No response from the API");
    });
  });

  describe("api/metadata", async () => {
    it("returns a successful response when the mock server responds successfully", async () => {
      const response = await nuxtTestUtilsFetch("/api/metadata");

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.modelVersion).toBe("0.0.19");
      expect(json.parameters[0].id).toBe("country");
    });

    it("returns a response with informative errors when the mock server responds with an error", async () => {
      const response = await nuxtTestUtilsFetch("/api/metadata");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("Not Found");
      const json = await response.json();
      expect(json.data[0].error).toBe("NOT_FOUND");
      expect(json.data[0].detail).toBe("Resource not found");
      expect(json.message).toBe("NOT_FOUND: Resource not found"); // A concatenation of the error details from the R API.
    });

    it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
      const response = await nuxtTestUtilsFetch("/api/metadata");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("error");

      const json = await response.json();
      expect(json.message).toBe("Unknown error: No response from the API");
    });
  });

  const requestNewScenario = async (mockoonResponse: string) => {
    const parameters = { country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none", mockoonResponse };
    const headers = new Headers();
    headers.append("content-type", "application/json");
    const body = JSON.stringify({ parameters });

    const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });
    return response;
  };

  // In these tests, Mockoon is configured to check the request body for all the expected parameters (and respond with the
  // appropriate status code etc.), as a way to test that the parameters (and model version) are being passed through all the way
  // to the R API. This check is called a 'rule' in Mockoon, and rules can't be used simultaneously with the 'sequential' setting,
  // so we instead use the mockoonResponse parameter to tell Mockoon which type of response to send.
  describe("post api/scenarios", async () => {
    const parametersHashForSuccessfulResponse = "28131f494aa5768f93bc8a52c554620bbdae9fedf934b9d221abda0e9d8fe5c1";

    beforeEach(async () => {
      await purgeRApiMockServer(); // Reset the mock server so that the version request is always successful.
    });

    describe("when a scenario with these parameters has not been run before", async () => {
      it("creates a scenario record and returns a successful response when the mock server responds successfully to a /scenario/run request", async () => {
        await expect(prisma.scenario.count()).resolves.toBe(0);

        const response = await requestNewScenario("successful");

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");

        const json = await response.json();
        expect(json.runId).toBe("successfulResponseRunId");

        await expect(prisma.scenario.count()).resolves.toBe(1);
        await expect(prisma.scenario.findFirst()).resolves.toMatchObject({
          parameters_hash: parametersHashForSuccessfulResponse,
          run_id: "successfulResponseRunId",
        });
      });

      it("returns a response with informative errors when the mock server responds with an error to a /scenario/run request", async () => {
        const response = await requestNewScenario("notFound");

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(response.statusText).toBe("Not Found");
        const json = await response.json();
        expect(json.data[0].error).toBe("NOT_FOUND");
        expect(json.data[0].detail).toBe("Resource not found");
        expect(json.message).toBe("NOT_FOUND: Resource not found"); // A concatenation of the error details from the R API.
        await expect(prisma.scenario.count()).resolves.toBe(0);
      });

      it("returns a response with informative errors when the mock server doesn't respond in time to a /scenario/run request", async () => {
        const response = await requestNewScenario("delayed");

        expect(response.ok).toBe(false);
        expect(response.status).toBe(500);
        expect(response.statusText).toBe("error");

        const json = await response.json();
        expect(json.message).toBe("Unknown error: No response from the API");
        await expect(prisma.scenario.count()).resolves.toBe(0);
      });

      it("returns a response with informative errors when the mock server responds with an error to a versions request", async () => {
        await nuxtTestUtilsFetch("/api/versions"); // This request should succeed, so that the next one will fail.

        const response = await requestNewScenario("successful");

        expect(response.ok).toBe(false);
        expect(response.status).toBe(500);
        expect(response.statusText).toBe("Internal Server Error");
        const json = await response.json();
        expect(json.data[0].error).toBe("Internal server error");
        expect(json.data[0].detail).toBe("Model version lookup failed.");
        expect(json.message).toBe("Internal server error: Model version lookup failed."); // A concatenation of the error details from the R API.
        await expect(prisma.scenario.count()).resolves.toBe(0);
      });
    });

    describe("when a scenario with these parameters has already been run before", async () => {
      beforeEach(async () => {
        await prisma.scenario.create({
          data: {
            parameters: { country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" },
            parameters_hash: parametersHashForSuccessfulResponse,
            run_id: "runIdOfPreExistingScenario",
          },
        });
      });

      it("does not create a scenario record, and returns the run id of the pre-existing scenario record", async () => {
        const existingScenario = await prisma.scenario.findFirst() as scenario;

        const response = await requestNewScenario("successful");

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");

        const json = await response.json();
        expect(json.runId).toBe("runIdOfPreExistingScenario");

        await expect(prisma.scenario.count()).resolves.toBe(1);
        await expect(prisma.scenario.findFirst()).resolves.toMatchObject(existingScenario);
      });
    });

    describe("when a scenario with these parameters has already been run before, but the R API does not recognise the run id", async () => {
      beforeEach(async () => {
        await prisma.scenario.create({
          data: {
            parameters: { country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" },
            parameters_hash: parametersHashForSuccessfulResponse,
            run_id: "notFoundRunId",
          },
        });
      });

      it("deletes the pre-existing scenario record, runs the analysis anew, creates a new scenario record with the new run id, and returns the run id", async () => {
        const existingScenario = await prisma.scenario.findFirst() as scenario;

        const response = await requestNewScenario("successful");

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");

        const json = await response.json();
        expect(json.runId).toBe("successfulResponseRunId");

        await expect(prisma.scenario.count()).resolves.toBe(1);
        await expect(prisma.scenario.findFirst()).resolves.not.toMatchObject(existingScenario); // scenario id should differ.
        await expect(prisma.scenario.findFirst()).resolves.toMatchObject({
          parameters_hash: parametersHashForSuccessfulResponse,
          run_id: "successfulResponseRunId",
        });
      });
    });
  });

  describe("api/scenarios/:id/status", async () => {
    it("returns a successful response when the mock server responds successfully", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/successfulResponseRunId/status`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.runStatus).toBe("complete");
      expect(json.runSuccess).toBe(true);
      expect(json.done).toBe(true);
      expect(json.runErrors).toBeNull();
      expect(json.runId).toBe("successfulResponseRunId");
    });

    it("returns a response with informative errors when the mock server responds with an error", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/notFoundRunId/status`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("Internal Server Error");
      const json = await response.json();
      expect(json.data[0].error).toBe("SERVER_ERROR");
      expect(json.data[0].detail).toBe("Missing result for task: 'notFoundRunId'");
      expect(json.message).toBe("SERVER_ERROR: Missing result for task: 'notFoundRunId'"); // A concatenation of the error details from the R API.
    });

    it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/slowResponseRunId/status`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("error");

      const json = await response.json();
      expect(json.message).toBe("Unknown error: No response from the API");
    });
  });

  describe("api/scenarios/:id/result", async () => {
    it("returns a successful response when the mock server responds successfully", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/successfulResponseRunId/result`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.runId).toBe("successfulResponseRunId");
      ["runId", "time_series", "parameters", "costs", "capacities", "interventions", "vsl"].forEach((key) => {
        expect(json).toHaveProperty(key);
      });
      expect(json.time_series.prevalence[0]).toBe(331.0026);
    });

    it("returns a response with informative errors when the mock server responds with an error", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/notFoundRunId/result`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("Internal Server Error");
      const json = await response.json();
      expect(json.data[0].error).toBe("SERVER_ERROR");
      expect(json.data[0].detail).toBe("Missing result for task: 'notFoundRunId'");
      expect(json.message).toBe("SERVER_ERROR: Missing result for task: 'notFoundRunId'"); // A concatenation of the error details from the R API.
    });

    it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/slowResponseRunId/result`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("error");

      const json = await response.json();
      expect(json.message).toBe("Unknown error: No response from the API");
    });
  });

  describe("api/scenarios/:id/details", async () => {
    it("returns a successful response when there is a matching scenario in the db", async () => {
      await prisma.scenario.create({
        data: {
          parameters: { country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" },
          parameters_hash: "hashedParams",
          run_id: "dbScenarioRunId",
        },
      });

      const response = await nuxtTestUtilsFetch(`/api/scenarios/dbScenarioRunId/details`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.runId).toBe("dbScenarioRunId");
      expect(json.parameters.country).toBe("Thailand");
      expect(json.parameters.pathogen).toBe("sars-cov-1");
      expect(json.parameters.response).toBe("no_closure");
      expect(json.parameters.vaccine).toBe("none");
    });

    it("returns a response with informative errors when the db has no matching scenario", async () => {
      const response = await nuxtTestUtilsFetch(`/api/scenarios/notFoundRunId/details`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("Scenario with ID 'notFoundRunId' not found");
      const json = await response.json();
      expect(json.statusCode).toBe(404);
      expect(json.message).toBe("Scenario with ID 'notFoundRunId' not found");
    });
  });
});
