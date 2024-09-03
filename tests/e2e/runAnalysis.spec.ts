import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);

  // const html = await page.innerHTML("body");
  // await expect("body").toContain("new scenario");
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  await page.selectOption('select[id="pathogen"]', { label: "Influenza 1957" });
  await page.selectOption('select[id="response"]', { label: "Elimination" });
  await page.selectOption('select[id="country"]', { label: "United States" });
  await page.click('div[aria-label="Advance vaccine investment"] label[for="medium"]');

  await page.click('button:has-text("Run")');

  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();
  await expect(page.getByText("results")).toBeVisible();
});
