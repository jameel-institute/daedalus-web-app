import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";
import waitForNewScenarioPage from "./helpers/waitForNewScenarioPage";

test.beforeAll(async () => {
  checkRApiServer();
});

test("can download Excel file for scenario results", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);
  // Run scenario with default parameters
  await page.click('button:has-text("Run")');
  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await page.waitForSelector("#btn-download-excel");
  const downloadBtn = page.locator("#btn-download-excel");
  await expect(downloadBtn).toBeVisible();
  await expect(page.getByText("Prevalence").first()).toBeVisible(); // Wait for data

  const [download] = await Promise.all([
    // Start waiting for the download
    page.waitForEvent("download"),
    // Perform the action that initiates download
    downloadBtn.click(),
  ]);

  // Wait for the download process to complete
  await download.path();

  // Filename is derived from parameter values, in this case the defaults
  const expectedFilename = "daedalus_THA_sars_cov_1_none_none_22000.xlsx";
  expect(download.suggestedFilename()).toBe(expectedFilename);
});
