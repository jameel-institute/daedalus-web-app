import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";
import waitForNewScenarioPage from "./helpers/waitForNewScenarioPage";
import startComparison from "~/tests/e2e/helpers/startComparison";
import runComparison from "~/tests/e2e/helpers/runComparison";

test.beforeAll(async () => {
  checkRApiServer();
});

const runScenario = async (page, baseURL) => {
  await waitForNewScenarioPage(page, baseURL);
  // Run scenario with default parameters
  await page.click('button:has-text("Run")');
  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await page.waitForSelector("#btn-download-excel");
  await expect(page.getByText("Prevalence").first()).toBeVisible(); // Wait for data
};

const doDownload = async (page, expectedFileName) => {
  const downloadBtn = page.locator("#btn-download-excel");
  await expect(downloadBtn).toBeVisible();

  const [download] = await Promise.all([
    // Start waiting for the download
    page.waitForEvent("download"),
    // Perform the action that initiates download
    downloadBtn.click(),
  ]);

  // Wait for the download process to complete
  await download.path();

  // Filename is derived from parameter values, in this case the defaults
  expect(download.suggestedFilename()).toBe(expectedFileName);
};

test("can download Excel file for scenario results", async ({ page, baseURL }) => {
  await runScenario(page, baseURL);
  await doDownload(page, "daedalus_THA_none_sars_cov_1_none_22000.xlsx");
});

test("can download Excel file for comparison results", async ({ page, baseURL, isMobile }) => {
  await runScenario(page, baseURL);
  await startComparison(page);

  await page.getByRole("button", { name: "Disease" }).first().click();
  const scenarioSelect = page.getByLabel(`Compare baseline scenario SARS 2004 against`);
  await expect(scenarioSelect).toBeVisible();
  await scenarioSelect.click();

  await page.getByRole("option", { name: "Covid-19 wild-type" }).click();
  await page.getByRole("option", { name: "Covid-19 Omicron" }).click();
  await runComparison(page, baseURL, isMobile);

  // wait for results
  await expect(page.locator("#compareCostsChartContainer text.highcharts-credits").first()).toBeVisible();

  await doDownload(page, "daedalus_comparison_pathogen_sars_cov_1_sars_cov_2_pre_alpha_sars_cov_2_omicron.xlsx");
});
