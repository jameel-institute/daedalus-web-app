import packageJson from "@/package.json";
import { getVersionData } from "@/server/handlers/versions";
import { registerEndpoint } from "@nuxt/test-utils/runtime";

const mockedVersionResponse = vi.fn();

// Mocking the response from the R API.
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
        daedalusWebApp: packageJson.version,
      });
      // Check we have a sensible version string in the package
      expect(response.data?.daedalusWebApp).toMatch(/\d+\.\d+\.\d/);
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

      expect(response.data).toBeNull();
      expect(response.statusCode).toBe(418);
      expect(response.statusText).toBe("I'm a teapot");
    });
  });
});
