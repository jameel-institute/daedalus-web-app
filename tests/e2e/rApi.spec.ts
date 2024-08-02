import { expect, test } from "@playwright/test";

test("Can access data from the R API", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);

  const html = await page.innerHTML("body");
  await expect(html).toContain("Home page");
  expect(html).toMatch(/Model version: (\d+\.)?(\d+\.)?(\*|\d+)/);
});
