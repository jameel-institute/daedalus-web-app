import { expect, request, test } from "@playwright/test";

// Check that we are not interacting with the mocked R API server.
const checkRApiServer = async () => {
  const rApiContext = await request.newContext({ baseURL: "http://localhost:8001" });
  try {
    const response = await rApiContext.get("/mock-smoke");
    expect(response.ok()).toBeFalsy(); // If this is truthy, you are probably running a mock server, meaning this is not an end-to-end test.
  } catch (error) {
    console.warn("As expected, the mock server couldn't be found. The test will attempt to use the real server.");
  }
};

test("Can access data from the R API", async ({ page, baseURL }) => {
  checkRApiServer();

  await page.goto(`${baseURL}/`);

  const html = await page.innerHTML("body");
  await expect(html).toContain("Home page");
  expect(html).toMatch(/Model version: (\d+\.)?(\d+\.)?(\*|\d+)/);
});
