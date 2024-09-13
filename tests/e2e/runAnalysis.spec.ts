import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.1/)).toHaveCount(1);

  await page.selectOption('select[id="pathogen"]', { label: "Influenza 1957" });
  await page.selectOption('select[id="response"]', { label: "Elimination" });
  await page.selectOption('select[id="country"]', { label: "United States" });
  await page.click('div[aria-label="Global vaccine investment"] label[for="medium"]');

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  expect(page.url()).toMatch(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));

  // TODO: Continue writing test
  // await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();
});
