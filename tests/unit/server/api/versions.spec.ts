// @vitest-environment node

// For background on how and why this test is set up the way it is, see
// tests/unit/server/api/README.md.

// Import the 'fetch' documented at the below URL as 'nuxtTestUtilsFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import { beforeAll, describe, expect, it } from "vitest";

const nodeFetch = fetch; // Normal 'fetch' from Node

beforeAll(async () => {
  // Verify that the user of the test suite has started the mock server
  // by checking that the server is listening on localhost:8001/mock-smoke

  let response;
  try {
    response = await nodeFetch("http://localhost:8001/mock-smoke"); // Use Node's fetch so that we can set a different base URL with port 8001.
  } catch (error) {
    if (response?.status !== 200) {
      process.stdout.write("The mock server couldn't be found. Please run `npx mockoon-cli start --data ./tests/unit/mocks/mockoon.json` or use the Mockoon desktop app.");
    }
  }

  // A failure, in order to exit the test if no mock server.
  expect(response?.status).toBe(200);
});

describe("api/versions", async () => {
  await setup(); // Start the Nuxt server

  it("returns the expected version data", async () => {
    const response = await nuxtTestUtilsFetch("/api/versions");
    const json = await response.json();

    expect(json.daedalusModel).toBe("1.2.3.4.5.6.7.8");
    expect(json.daedalusApi).toBe("8.7.6.5.4.3.2.1");
    expect(json.daedalusWebApp).toMatch(/(\d+\.)?(\d+\.)?(\*|\d+)/);
  });
});
