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

  await page.selectOption('select[aria-label="Disease"]', { label: "Influenza 1957" });
  await page.selectOption('select[aria-label="Response"]', { label: "Elimination" });
  await page.selectOption('select[aria-label="Country"]', { label: "United States" });
  await page.click('div[aria-label="Global vaccine investment"] label[for="low"]');
  await page.fill('input[aria-label="Hospital capacity"]', "200000");

  await page.click('button:has-text("Run")');

  const dummyRunIdHash = "007e5f5453d64850";
  await page.waitForURL(`${baseURL}/scenarios/${dummyRunIdHash}`);
  await expect(page.url()).toBe(`${baseURL}/scenarios/${dummyRunIdHash}`);

  // TODO: Continue writing test
  // await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();
});
