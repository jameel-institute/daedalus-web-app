import { expect, test } from "@playwright/test";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
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

// We are switching off visual testing until such a time as the underlying model code is stable enough that these
// screenshots are not constantly changing, and are not so brittle.
const useVisualScreenshotTesting = false;

test("Can request a scenario analysis run", async ({ page, baseURL, headless }) => {
  await waitForNewScenarioPage(page, baseURL);

  await selectParameterOption(page, "pathogen", "SARS 2004");
  await selectParameterOption(page, "response", "Elimination");

  const initialCountryValue = await page.inputValue(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(initialCountryValue);
  await selectParameterOption(page, "country", "United States");
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).not.toHaveValue(initialCountryValue);

  await page.click(`div[aria-label="${parameterLabels.vaccine}"] label[for="medium"]`);
  await page.fill(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`, "305000");

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  const urlOfFirstAnalysis = page.url();
  expect(page.url()).toMatch(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();

  await expect(page.getByText("SARS 2004").first()).toBeVisible();
  await expect(page.getByText("Elimination").first()).toBeVisible();
  await expect(page.getByText("United States").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText("305,000").first()).toBeVisible();

  await expect(page.locator("#prevalence-container")).toBeVisible({ timeout: 20000 });
  await page.locator("#prevalence-container").scrollIntoViewIfNeeded();
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-plot-band")).toBeVisible();
  await expect(page.locator("#prevalence-container").getByLabel("View chart menu, Chart")).toBeVisible();

  await expect(page.locator("#hospitalised-container")).toBeVisible();
  await page.locator("#hospitalised-container").scrollIntoViewIfNeeded();
  await expect(page.locator("#hospitalised-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#hospitalised-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#hospitalised-container .highcharts-plot-band")).toBeVisible();
  await expect(page.locator("#hospitalised-container .highcharts-plot-line")).toBeInViewport();
  await expect(page.locator("#hospitalised-container").getByLabel("View chart menu, Chart")).toBeVisible();

  await expect(page.locator("#dead-container")).toBeVisible();
  await expect(page.locator("#dead-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#dead-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#dead-container").getByLabel("View chart menu, Chart")).toBeVisible();

  await expect(page.locator("#vaccinated-container")).toBeVisible();
  await expect(page.locator("#vaccinated-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#vaccinated-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#vaccinated-container").getByLabel("View chart menu, Chart")).toBeVisible();

  await expect(page.locator("#costsChartContainer rect").first()).toBeVisible();

  // To regenerate these screenshots:
  // 1. Insert a generous timeout so that screenshots are of the final chart, not the chart half-way through
  //    its initialization animation: `await page.waitForTimeout(10000);`
  // 2. Delete the screenshots directory, ./<this-file-name>-snapshots
  // 3. Run the tests with `npm run test:e2e` to regenerate the screenshots - tests will appear to fail the first time.
  // Make sure to stop any local development server first so that Playwright runs its own server, in production mode, so that the
  // Nuxt devtools are not present in the screenshots.
  if (headless && useVisualScreenshotTesting) {
    await expect(page.locator(".accordion-body").first()).toHaveScreenshot("first-time-series.png", { maxDiffPixelRatio: 0.04, timeout: 15000 });
    await expect(page.locator(".accordion-body").nth(1)).toHaveScreenshot("second-time-series.png", { maxDiffPixelRatio: 0.04 });
    await expect(page.locator(".accordion-body").nth(2)).toHaveScreenshot("third-time-series.png", { maxDiffPixelRatio: 0.04 });
    await expect(page.locator(".accordion-body").nth(3)).toHaveScreenshot("fourth-time-series.png", { maxDiffPixelRatio: 0.04 });
    await expect(page.locator("#costsChartContainer rect").first()).toHaveScreenshot("costs-pie.png", { maxDiffPixelRatio: 0.04 });

    // Test re-sizing of the charts
    await page.getByRole("button", { name: "Prevalence" }).click();
    await expect(page.locator(".accordion-body").nth(2)).toHaveScreenshot("third-time-series-taller.png", { maxDiffPixelRatio: 0.04 });
    await page.getByRole("button", { name: "Hospital demand" }).click();
    await expect(page.locator(".accordion-body").nth(2)).toHaveScreenshot("third-time-series-tallest.png", { maxDiffPixelRatio: 0.04 });
  } else {
    console.warn("No screenshot comparison");
  }

  await page.getByRole("button", { name: "Parameters" }).first().click();
  // The following line has been known to fail locally on webkit, but pass on CI.
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();

  await expect(page.getByRole("combobox", { name: parameterLabels.country }).locator(".single-value")).toHaveText("United States");
  await expect(page.getByRole("combobox", { name: parameterLabels.pathogen }).locator(".single-value")).toHaveText("SARS 2004");
  await expect(page.getByRole("combobox", { name: parameterLabels.response }).locator(".single-value")).toHaveText("Elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");

  await page.click(`div[aria-label="${parameterLabels.vaccine}"] label[for="high"]`);
  await page.waitForSelector('button:has-text("Run"):not([disabled])');
  await page.click('button:has-text("Run")');

  await page.waitForTimeout(1000);

  const urlOfSecondAnalysis = page.url();
  expect(urlOfSecondAnalysis).not.toEqual(urlOfFirstAnalysis);
  expect(urlOfSecondAnalysis).toMatch(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await expect(page.getByText("High").first()).toBeVisible();
});
