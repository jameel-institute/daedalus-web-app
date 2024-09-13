// @vitest-environment node

// For background on how and why this test is set up the way it is, see
// tests/integration/README.md.

// Import the 'fetch' documented at the below URL as 'nuxtTestUtilsFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import { beforeAll, describe, expect, it } from "vitest";
import dotenv from "dotenv";

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
    } catch (error) {
      if (response?.status !== 200) {
        process.stdout.write("The mock server couldn't be found. Please run `npx mockoon-cli start --data ./tests/unit/mocks/mockoon.json` or use the Mockoon desktop app.");
      }
    }

    // A failure, in order to exit the test if no mock server.
    expect(response?.status).toBe(200);

    // Send a request to 'purge' Mockoon, i.e. reset it to its initial state,
    // so that responses configured to be sequential will start from the first response.
    // https://mockoon.com/docs/latest/admin-api/server-state/
    const purgeUrl = `${rApiBaseUrl}/mockoon-admin/state/purge`;
    const purgeResponse = await nodeFetch(purgeUrl, { method: "POST" });
    expect(purgeResponse?.status).toBe(200);
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
      expect(json.modelVersion).toBe("0.1.0");
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
    it("returns a successful response when the mock server responds successfully", async () => {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      const body = JSON.stringify(
        { parameters: { mockoonResponse: "successful", country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" } },
      );

      const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");

      const json = await response.json();
      expect(json.runId).toBe("007e5f5453d64850");
    });

    it("returns a response with informative errors when the mock server responds with an error", async () => {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      const body = JSON.stringify(
        { parameters: { mockoonResponse: "notFound", country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" } },
      );
      const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("Not Found");
      const json = await response.json();
      expect(json.data[0].error).toBe("NOT_FOUND");
      expect(json.data[0].detail).toBe("Resource not found");
      expect(json.message).toBe("NOT_FOUND: Resource not found"); // A concatenation of the error details from the R API.
    });

    it("returns a response with informative errors when the mock server doesn't respond in time", async () => {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      const body = JSON.stringify(
        { parameters: { mockoonResponse: "delayed", country: "Thailand", pathogen: "sars-cov-1", response: "no_closure", vaccine: "none" } },
      );

      const response = await nuxtTestUtilsFetch(`/api/scenarios`, { method: "POST", body, headers });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("error");

      const json = await response.json();
      expect(json.message).toBe("Unknown error: No response from the API");
    });
  });
});
