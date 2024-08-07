import { describe, expect, it } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { fetchRApi } from "@/server/utils/rApi";

describe("fetchRApi", () => {
  it("should make a request to the correct URL when given an endpoint", async () => {
    registerEndpoint("/my-endpoint", () => {
      return {
        status: "success",
        errors: null,
        data: {
          test: "expectedData",
        },
      };
    });

    const response = await fetchRApi("/my-endpoint");

    expect(response.data).toEqual({ test: "expectedData" });
    expect(response.errors).toBeNull();
    expect(response.statusCode).toBe(200);
    expect(response.statusText).toBe("");
  });

  it("should allow setting $fetch options using options parameter", async () => {
    registerEndpoint("/my-post-endpoint", {
      method: "POST",
      handler: () => ({
        status: "success",
        errors: null,
        data: {
          hasPosted: "success",
        },
      }),
    });

    const response = await fetchRApi("/my-post-endpoint", { method: "POST" });

    expect(response.data).toEqual({ hasPosted: "success" });
    expect(response.errors).toBeNull();
    expect(response.statusCode).toBe(200);
    expect(response.statusText).toBe("");
  });

  describe("when the R API response is unsuccessful", () => {
    it("passes on the status code and message", async () => {
      registerEndpoint("/broken-endpoint", () => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await fetchRApi("/broken-endpoint");

      // NB Couldn't find a way to expose error details in the response using registerEndpoint,
      // but the error details are passed on in the real implementation and this is tested in
      // the integration tests.
      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
