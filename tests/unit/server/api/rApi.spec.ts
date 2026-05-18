import { fetchRApi, R_API_REQUEST_STAGGER_MS, resetRApiRequestStagger, waitForRApiRequestSlot } from "@/server/utils/rApi";
import { registerEndpoint } from "@nuxt/test-utils/runtime";

describe("fetchRApi", () => {
  beforeEach(() => {
    resetRApiRequestStagger();
  });

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

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });

  it("staggers queued R API request start times", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    try {
      const started: string[] = [];
      const firstRequest = waitForRApiRequestSlot().then(() => started.push("first"));
      const secondRequest = waitForRApiRequestSlot().then(() => started.push("second"));
      const thirdRequest = waitForRApiRequestSlot().then(() => started.push("third"));

      await vi.advanceTimersByTimeAsync(0);
      expect(started).toEqual(["first"]);

      await vi.advanceTimersByTimeAsync(R_API_REQUEST_STAGGER_MS - 1);
      expect(started).toEqual(["first"]);

      await vi.advanceTimersByTimeAsync(1);
      expect(started).toEqual(["first", "second"]);

      await vi.advanceTimersByTimeAsync(R_API_REQUEST_STAGGER_MS);
      expect(started).toEqual(["first", "second", "third"]);

      await Promise.all([firstRequest, secondRequest, thirdRequest]);
    } finally {
      vi.useRealTimers();
    }
  });
});
