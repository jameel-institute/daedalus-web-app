// Import the 'fetch' documented at the below URL as 'nuxtFetch' to avoid conflicts with Node's own 'fetch' function
// https://nuxt.com/docs/getting-started/testing#fetchurl-1
import { fetch as nuxtTestUtilsFetch, setup } from "@nuxt/test-utils/e2e";
import { beforeAll, describe, expect, it } from "vitest";

const nodeFetch = fetch; // Normal 'fetch' from Node

beforeAll(async () => {
  // Verify that the user of the test suite has started the mock server
  // by checking that the server is listening on localhost:8001

  let response;
  try {
    response = await nodeFetch("http://localhost:8001/mock-smoke"); // Use Node's fetch so that we can set a different base URL with port 8001.
  } catch (error) {
    if (response?.status !== 200) {
      process.stdout.write("The mock server couldn't be found. Please run `npx mockoon-cli start --data ./mocks/mockoon.json` or use the Mockoon desktop app.");
    }
  }

  // A failure for CI to break on.
  expect(response?.status).toBe(200);
});

describe("api/versions", async () => {
  // Run the setup function to start the Nuxt server
  await setup({
    runner: "vitest", // this is the default value but I'm just making it explicit
  });

  it("returns the expected version data", async () => {
    const response = await nuxtTestUtilsFetch("/api/versions");
    const json = await response.json();

    expect(json.daedalusModel).toBe("externally mocked daedalus model version");
    expect(json.daedalusApi).toBe("externally mocked R API version");
    expect(json.daedalusWebApp).toMatch(/(\d+\.)?(\d+\.)?(\*|\d+)/);
  });
});
