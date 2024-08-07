import { describe, expect, it, vi } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { getVersionData } from "@/server/handlers/versions";

const mockedVersionResponse = vi.fn();

registerEndpoint("/", mockedVersionResponse);

describe("get version data", () => {
  describe("when the R API response is successful", () => {
    it("should return the expected version data", async () => {
      mockedVersionResponse.mockImplementation(() => {
        return {
          status: "success",
          errors: null,
          data: {
            "daedalus": "0.1.0",
            "daedalus.api": "0.1.999",
          },
        };
      });

      const response = await getVersionData();

      expect(response.data).toEqual({
        daedalusApi: "0.1.999",
        daedalusModel: "0.1.0",
        daedalusWebApp: "0.0.1",
      });
      expect(response.errors).toBeNull();
      expect(response.statusCode).toBe(200);
      expect(response.statusText).toBe("");
    });
  });

  describe("when the R API response is unsuccessful", () => {
    it("passes on the status code and message", async () => {
      mockedVersionResponse.mockImplementation(() => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await getVersionData();

      // NB Couldn't find a way to expose error details in the response using registerEndpoint,
      // but the error details are passed on in the real implementation and this is tested in
      // the integration tests.
      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
