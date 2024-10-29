import { expect, test } from "@playwright/test";

test("can see version info in About page", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/about`);
  await expect(page.getByText("The DAEDALUS Explore dashboard", { exact: true })).toBeVisible();
  await expect(page.getByText(/Model version: \d+\.\d+\.\d/)).toBeVisible();
  await expect(page.getByText(/R API version: \d+\.\d+\.\d/)).toBeVisible();
  await expect(page.getByText(/Web app version: \d+\.\d+\.\d/)).toBeVisible();
});
