import { expect, test } from "@playwright/test";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import checkRApiServer from "./helpers/checkRApiServer";
import waitForNewScenarioPage from "./helpers/waitForNewScenarioPage";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can show relevant alerts for long-running analysis, e.g. Omicron in Singapore", async ({ page, baseURL, browserName }) => {
  test.skip(browserName !== "firefox", "Run in only one browser to save time");
  await waitForNewScenarioPage(page, baseURL);

  // This parameter combination reliably takes upwards of 15 seconds to run.
  await selectParameterOption(page, "country", "Singapore");
  await selectParameterOption(page, "pathogen", "Covid-19 Omicron");
  await page.click('button:has-text("Run")');
  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).not.toContain("Analysis status: running");
  expect(await page.textContent(".wrapper")).not.toContain("Thank you for waiting.");

  await page.waitForTimeout(6000);

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).toContain("Analysis status: running"); // Start to show current status
  expect(await page.textContent(".wrapper")).not.toContain("Thank you for waiting.");

  await page.waitForTimeout(10000);

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).toContain("Analysis status: running");
  expect(await page.textContent(".wrapper")).toContain("Thank you for waiting."); // Start to show warning of long running analysis

  // The analysis reliably takes less than two minutes to run.
  // Test that we do eventually see a result: the page does not give up on polling.
  await expect(page.getByRole("heading", { name: "Time series" })).toBeVisible({ timeout: 120000 });

  expect(await page.textContent(".wrapper")).not.toContain("Thank you for waiting.");
});
