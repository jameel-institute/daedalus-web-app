import { describe, expect, it } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { FetchError } from "ofetch";
import { fetchRApi } from "@/server/utils/rApi";

// NB these tests, of a server utility function, are able to successfully mock the R API server without the need
// for a separate mock server.
// This is because we're able to directly call the fetchRApi function, which sends onward requests using $fetch,
// which @nuxt/test-utils is able to mock. By contrast, the most direct way to invoke our own API endpoints
// (which we shouldn't mock when testing them!) is to:
// 1. Use @nuxt/test-utils/e2e to run a test server.
// 2. Use the 'fetch' utility provided by @nuxt/test-utils/e2e, so that we can make requests to our endpoints on
//    the test server in a Nuxt environment where e.g. Nuxt plugins and imports are available.
// 3. Use a separate service such as Mockoon to run a separate server for the R API, since Nuxt's $fetch function
//    cannot be mocked.
// Thus, although the set-up just described is not very unit-like and is more like an integration test, it is
// the closest to unit-testing that the Nuxt eco-system seems to currently offer.

describe("fetchRApi", () => {
  it("should make a request to the correct URL when given an endpoint", async () => {
    registerEndpoint("/my-endpoint", () => {
      return {
        data: "expectedData",
      };
    });

    const response = await fetchRApi("/my-endpoint");

    expect(response).toEqual({
      data: "expectedData",
    });
  });

  it("should allow setting $fetch options using options parameter", async () => {
    registerEndpoint("/my-post-endpoint", {
      method: "POST",
      handler: () => ({
        hasPosted: "success",
      }),
    });

    const response = await fetchRApi("/my-post-endpoint", { method: "POST" });

    expect(response).toEqual({
      hasPosted: "success",
    });
  });

  it("should throw an internal server error when the R API responds with any error", async () => {
    registerEndpoint("/not-an-endpoint", () => {
      throw FetchError;
    });

    expect(fetchRApi("/not-an-endpoint")).rejects.toThrow("Internal Server Error");
  });
});
