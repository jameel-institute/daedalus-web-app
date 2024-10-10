import { getMetadata } from "@/server/handlers/metadata";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

const mockedMetadataResponse = vi.fn();
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

registerEndpoint("/metadata", mockedMetadataResponse);

describe("get metadata", () => {
  describe("when the R API response is successful", () => {
    it("should return the expected metadata", async () => {
      mockedMetadataResponse.mockImplementation(() => {
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
      mockedMetadataResponse.mockImplementation(() => {
        throw createError({
          statusCode: 418,
          statusMessage: "I'm a teapot",
        });
      });

      const response = await getMetadata();

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
