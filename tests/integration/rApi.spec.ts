// @vitest-environment node

// For background on how and why this test is set up the way it is, see
// tests/integration/README.md.

// Import the 'fetch' documented at the below URL as 'nuxtTestUtilsFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import type { scenario } from "@prisma/client";
import dotenv from "dotenv";
import prisma from "~/lib/prisma";

const localWebServerUrl = "http://localhost:3000";
const nodeFetch = fetch; // Normal 'fetch' from Node

const env = dotenv.config().parsed;
let rApiBaseUrl = env!.NUXT_R_API_BASE;
rApiBaseUrl = rApiBaseUrl.endsWith("/") ? rApiBaseUrl.slice(0, -1) : rApiBaseUrl;

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

    // Wait for the local web server to be ready before running the tests
    await new Promise<void>((resolve) => {
      const checkServer = async () => {
        try {
          const response = await nodeFetch(localWebServerUrl);
          if (response.status === 200) {
            resolve();
          } else {
            setTimeout(checkServer, 1000);
          }
        } catch {
          setTimeout(checkServer, 1000);
        }
      };

      checkServer();
    });

    // Send a request to 'purge' Mockoon, i.e. reset it to its initial state,
    // so that responses configured to be sequential will start from the first response.
    // https://mockoon.com/docs/latest/admin-api/server-state/
    const purgeUrl = `${rApiBaseUrl}/mockoon-admin/state/purge`;
    const purgeResponse = await nodeFetch(purgeUrl, { method: "POST" });
    expect(purgeResponse?.status).toBe(200);
  });

  afterEach(async () => {
    await prisma.scenario.deleteMany({});
  });

  // Normally @nuxt/test-utils/e2e would handle setting up and running the server itself (see https://nuxt.com/docs/getting-started/testing#setup-1),
  // but since we first need to run db migrations on whatever server is going to be tested, we instead run a server and db ourselves,
  // and perform these tests against that server.
  await setup({ host: localWebServerUrl });

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

  // In these tests, Mockoon is configured to check the request body for all the expected parameters (and respond with the
  // appropriate status code etc.), as a way to test that the parameters (and model version) are being passed through all the way
  // to the R API. This is called a 'rule' in Mockoon, and rules can't be used simultaneously with the 'sequential' setting, so we
  // instead use the mockoonResponse parameter to tell Mockoon which type of response to send.
  describe("post api/scenarios", async () => {
    const parameters = { country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" };
    const parametersHashForSuccessfulResponse = "84cf3d71c34fa31c5b0b02e3cca67b9eaca49e45b57c25a268f9dff6c6798409";

    describe("when a scenario with these parameters has not been run before", async () => {
      it("creates a scenario record and returns a successful response when the mock server responds successfully", async () => {
        const headers = new Headers();
        headers.append("content-type", "application/json");
        const body = JSON.stringify(
          { parameters: { ...parameters, mockoonResponse: "successful" } },
        );

        await expect(prisma.scenario.count()).resolves.toBe(0);

        const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

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

      it("returns a response with informative errors when the mock server responds with an error", async () => {
        const headers = new Headers();
        headers.append("content-type", "application/json");
        const body = JSON.stringify(
          { parameters: { ...parameters, mockoonResponse: "notFound" } },
        );
        const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(response.statusText).toBe("Not Found");
        const json = await response.json();
        expect(json.data[0].error).toBe("NOT_FOUND");
        expect(json.data[0].detail).toBe("Resource not found");
        expect(json.message).toBe("NOT_FOUND: Resource not found"); // A concatenation of the error details from the R API.
        await expect(prisma.scenario.count()).resolves.toBe(0);
      });

      it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
        const headers = new Headers();
        headers.append("content-type", "application/json");
        const body = JSON.stringify(
          { parameters: { ...parameters, mockoonResponse: "delayed" } },
        );

        const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(500);
        expect(response.statusText).toBe("error");

        const json = await response.json();
        expect(json.message).toBe("Unknown error: No response from the API");
        await expect(prisma.scenario.count()).resolves.toBe(0);
      });
    });

    describe("when a scenario with these parameters has already been run before", async () => {
      beforeEach(async () => {
        await prisma.scenario.create({
          data: {
            parameters_hash: parametersHashForSuccessfulResponse,
            run_id: "runIdOfPreExistingScenario",
          },
        });
      });

      it("does not create a scenario record, and returns the run id of the pre-existing scenario record", async () => {
        const headers = new Headers();
        headers.append("content-type", "application/json");
        const body = JSON.stringify(
          { parameters: { ...parameters, mockoonResponse: "successful" } },
        );

        const existingScenario = await prisma.scenario.findFirst() as scenario;

        const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

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
            parameters_hash: parametersHashForSuccessfulResponse,
            run_id: "notFoundRunId",
          },
        });
      });

      it("deletes the pre-existing scenario record, runs the analysis anew, creates a new scenario record with the new run id, and returns the run id", async () => {
        const headers = new Headers();
        headers.append("content-type", "application/json");
        const body = JSON.stringify(
          { parameters: { ...parameters, mockoonResponse: "successful" } },
        );

        const existingScenario = await prisma.scenario.findFirst() as scenario;

        const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

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
      ["runId", "time_series", "parameters", "costs", "capacities", "interventions"].forEach((key) => {
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
});
