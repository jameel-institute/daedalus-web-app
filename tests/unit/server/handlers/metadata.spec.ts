import { describe, expect, it, vi } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { getMetadata } from "@/server/handlers/metadata";

const mockedVersionResponse = vi.fn();
const exampleMetadata = {
  modelVersion: "0.1.0",
  parameters: [
    {
      id: "param1",
      label: "Parameter 1",
      parameterType: "select",
      defaultOption: "option1",
      ordered: false,
      options: [{
        id: "option1",
        label: "Option 1",
      }],
    },
    {
      id: "param2",
      label: "Parameter 2",
      parameterType: "globeSelect",
      defaultOption: null,
      ordered: true,
      options: [{
        id: "option1",
        label: "Option 1",
      }],
    },
  ],
};

registerEndpoint("/metadata", mockedVersionResponse);

describe("get metadata", () => {
  describe("when the R API response is successful", () => {
    it("should return the expected metadata", async () => {
      mockedVersionResponse.mockImplementation(() => {
        return {
          status: "success",
          errors: null,
          data: exampleMetadata,
        };
      });

      const response = await getMetadata();

      expect(response.data).toEqual(exampleMetadata);
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

      const response = await getMetadata();

      // NB Couldn't find a way to expose error details in the response using registerEndpoint,
      // but the error details are passed on in the real implementation and this is tested in
      // the integration tests.
      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
