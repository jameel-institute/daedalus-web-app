import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`); // Should redirect to new scenario page
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  await page.selectOption('select[id="pathogen"]', { label: "Influenza 1957" });
  await page.selectOption('select[id="response"]', { label: "Elimination" });
  await page.selectOption('select[id="country"]', { label: "United States" });
  await page.click('div[aria-label="Global vaccine investment"] label[for="medium"]');

  await page.click('button:has-text("Run")');

  // TODO: Continue writing test
  // await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();
});
