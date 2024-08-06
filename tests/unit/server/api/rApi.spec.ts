import { describe, expect, it } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { FetchError } from "ofetch";
import { fetchRApi } from "@/server/utils/rApi";

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
