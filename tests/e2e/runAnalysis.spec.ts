import type { Page } from "@playwright/test";
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
const philippinesMinimumHospitalCapacity = "16300";
const philippinesMinimumHospitalCapacityFormatted = "16,300";
const scenarioPathMatcher = "scenarios/[a-f0-9]{32}";

test.beforeAll(async () => {
  checkRApiServer();
});

// We are switching off visual testing until such a time as the underlying model code is stable enough that these
// screenshots are not constantly changing, and are not so brittle.
const useVisualScreenshotTesting = false;

const expectSelectParameterToHaveValueLabel = async (page: Page, parameterLabel: string, expectedValueLabel: string) => {
  await expect(page.getByRole("combobox", { name: parameterLabel }).locator(".single-value"))
    .toHaveText(expectedValueLabel);
};

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

  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  const urlOfFirstAnalysis = page.url();
  expect(page.url()).toMatch(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();

  await expect(page.getByText("SARS 2004").first()).toBeVisible();
  await expect(page.getByText("Elimination").first()).toBeVisible();
  await expect(page.getByText("United States").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText("305,000").first()).toBeVisible();

  // Check for GDP percentage headline figure
  await expect(page.getByText(/\d{1,3}\.\d%of 2018 GDP/)).toBeVisible({ timeout: 20000 });
  // Check for USD$ headline figure
  await expect(page.getByText(/\$.*USD \d{1,3}\.\d[BTM]$/)).toBeVisible();

  await expect(page.locator("#prevalence-container")).toBeVisible();
  await page.locator("#prevalence-container").scrollIntoViewIfNeeded();
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-plot-band")).toBeVisible();
  await expect(page.locator("#prevalence-container").getByLabel("View chart menu, Chart")).toBeVisible();

  // Check can toggle time series to "New per day" and back
  await expect(page.getByText("New per day").first()).toBeVisible();
  await page.locator("#infectionsDailySwitch").check();
  await expect(page.getByRole("button", { name: "New infections Number of new" })).toBeVisible();
  await page.locator("#infectionsDailySwitch").setChecked(false);
  await expect(page.getByRole("button", { name: "Prevalence Number of" })).toBeVisible();

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

  // Run a second analysis with a different parameter, using the parameters form on the results page.
  await page.getByRole("button", { name: "Parameters" }).first().click();
  // The following line has been known to fail locally on webkit, but pass on CI.
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();

  await expectSelectParameterToHaveValueLabel(page, parameterLabels.country, "United States");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.pathogen, "SARS 2004");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.response, "Elimination");

  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");

  await selectParameterOption(page, "country", "Philippines");
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);

  await page.waitForSelector('button:has-text("Run"):not([disabled])');
  await page.click('button:has-text("Run")');

  // Test that the second analysis results page has a different run id, and hence URL, from the first analysis.
  const pathOfFirstAnalysis = new URL(urlOfFirstAnalysis).pathname;
  const matchAnyScenarioResultPathExceptTheFirst = new RegExp(`^${baseURL}(?!${pathOfFirstAnalysis}$).*${scenarioPathMatcher}$`);
  await page.waitForURL(new RegExp(matchAnyScenarioResultPathExceptTheFirst));

  // Test that the second analysis results page shows the correct parameters.
  await expect(page.getByText("SARS 2004").first()).toBeVisible();
  await expect(page.getByText("Elimination").first()).toBeVisible();
  await expect(page.getByText("Philippines").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText(philippinesMinimumHospitalCapacityFormatted).first()).toBeVisible();

  // Test that the second analysis results page has the correct parameters within the parameters form modal.
  await page.getByRole("button", { name: "Parameters" }).first().click();
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.country, "Philippines");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.pathogen, "SARS 2004");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.response, "Elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  const closeButton = page.getByLabel("Edit parameters").getByLabel("Close");
  await closeButton.click();

  // Test that the second analysis results page has charts of both types.
  await expect(page.locator("#prevalence-container")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#costsChartContainer rect").first()).toBeVisible();

  // Test that the user can navigate to previously-run analyses, including when the page is initially rendered server-side.
  await page.goto(urlOfFirstAnalysis);
  await page.waitForURL(urlOfFirstAnalysis);
  await expect(page.getByText("United States").first()).toBeVisible();
  await expect(page.locator("#prevalence-container")).toBeVisible(); // Should be visible fairly instantaneously since the analysis has already been run

  // Test that, after arriving to the web app from the /scenarios/:id URL, the user can still navigate
  // to the home page: this has broken in the past.
  await page.goto(urlOfFirstAnalysis);
  await page.getByRole("link", { name: "DAEDALUS Explore" }).click();
  await page.waitForURL(`${baseURL}/scenarios/new`);
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();
});
