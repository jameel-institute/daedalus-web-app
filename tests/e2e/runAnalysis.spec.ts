import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL, isMobile }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.1/)).toHaveCount(1);

  await page.selectOption('select[aria-label="Disease"]', { label: "Influenza 1957" });
  await page.selectOption('select[aria-label="Response"]', { label: "Elimination" });

  const initialCountryValue = await page.inputValue('input[aria-label="Hospital capacity"][type="number"]');
  await page.selectOption('select[aria-label="Country"]', { label: "United States" });
  await expect(page.locator('input[aria-label="Hospital capacity"][type="number"]')).not.toHaveValue(initialCountryValue);

  await page.click('div[aria-label="Global vaccine investment"] label[for="medium"]');
  await page.fill('input[aria-label="Hospital capacity"][type="number"]', "200000");

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  expect(page.url()).toMatch(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();

  if (isMobile) {
    await expect(page.getByText("Rotate your mobile device").first()).toBeVisible();
    await page.click('*:has-text("Parameters")');
  } else {
    await expect(page.getByText("Rotate your mobile device").first()).not.toBeVisible();
  }
  await expect(page.getByText("Influenza 1957").first()).toBeVisible();
  await expect(page.getByText("Elimination").first()).toBeVisible();
  await expect(page.getByText("United States").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText("200000").first()).toBeVisible();
});
