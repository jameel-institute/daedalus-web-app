import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

const parameterLabels = {
  country: "Country",
  pathogen: "Disease",
  response: "Response",
  vaccine: "Global vaccine investment",
  hospital_capacity: "Hospital surge capacity",
};

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can show relevant alerts for long-running analysis, e.g. Omicron in Singapore", async ({ page, baseURL, browserName }) => {
  test.skip(browserName !== "firefox", "Run in only one browser to save time");
  await page.goto(`${baseURL}/scenarios/new`);

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.2/)).toHaveCount(1);

  // This parameter combination reliably takes upwards of 15 seconds to run.
  await page.selectOption(`select[aria-label="${parameterLabels.country}"]`, { label: "Singapore" });
  await page.selectOption(`select[aria-label="${parameterLabels.pathogen}"]`, { label: "Covid-19 Omicron" });
  await page.click('button:has-text("Run")');
  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).not.toContain("Analysis status: running");
  expect(await page.textContent(".wrapper")).not.toContain("The analysis is taking longer than expected.");

  await page.waitForTimeout(6000);

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).toContain("Analysis status: running"); // Start to show current status
  expect(await page.textContent(".wrapper")).not.toContain("The analysis is taking longer than expected.");

  await page.waitForTimeout(10000);

  expect(await page.textContent(".wrapper")).toContain("Loading..."); // Accessibility text from spinner
  expect(await page.textContent(".wrapper")).toContain("Analysis status: running");
  expect(await page.textContent(".wrapper")).toContain("The analysis is taking longer than expected."); // Start to show warning of long running analysis

  // The analysis reliably takes less than a minute to run.
  // Test that we do eventually see a result: the page does not give up on polling.
  await expect(page.getByRole("heading", { name: "Time series" })).toBeVisible({ timeout: 60000 });

  expect(await page.textContent(".wrapper")).not.toContain("The analysis is taking longer than expected.");
});
