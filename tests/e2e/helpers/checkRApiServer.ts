import { expect, request } from "@playwright/test";

// Check that we are not interacting with the mocked R API server.
export default async () => {
  const rApiContext = await request.newContext({ baseURL: "http://localhost:8001" });
  try {
    const response = await rApiContext.get("/mock-smoke");
    expect(response.ok()).toBeFalsy(); // If this is truthy, you are probably running a mock server, meaning this is not an end-to-end test.
  } catch (error) {
    console.warn("As expected, the mock server couldn't be found. The test will attempt to use the real server.");
  }
};