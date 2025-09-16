import { expect, type Locator, type Page, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import { commaSeparatedNumberMatcher, costTolerance, decimalPercentMatcher, parameterLabels, runIdMatcher, scenarioPathMatcher } from "./helpers/constants";
import checkValueIsInRange from "./helpers/checkValueIsInRange";
import checkBarChartDataIsDifferent from "./helpers/checkBarChartDataIsDifferent";
import { checkMultiScenarioTimeSeriesDataPoints } from "./helpers/checkTimeSeriesDataPoints";

const baselinePathogenOption = "SARS 2004";
const assertTimeSeriesPresent = async (page: Page, seriesLocator: Locator) => {
  await expect(seriesLocator).toBeVisible();
  await seriesLocator.scrollIntoViewIfNeeded();
  await expect(seriesLocator.locator(".highcharts-xaxis-labels")).toBeVisible();
  await expect(seriesLocator.locator(".highcharts-yaxis-labels")).toBeVisible();
};

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can compare multiple scenarios", async ({ baseURL, context, isMobile, page }) => {
  await waitForNewScenarioPage(page, baseURL);

  await selectParameterOption(page, "pathogen", "SARS 2004");
  await selectParameterOption(page, "response", "Elimination");
  await selectParameterOption(page, "country", "United States");
  await page.click(`div[aria-label="${parameterLabels.vaccine}"] label[for="medium"]`);
  await page.fill(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`, "305000");

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  const urlOfBaselineScenario = page.url();
  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();

  await page.getByRole("button", { name: "Compare against other scenarios" }).first().click();
  await expect(page.getByRole("heading", { name: "Start a comparison against this baseline" })).toBeVisible();

  await page.getByRole("button", { name: "Disease" }).first().click();

  const scenarioSelect = page.getByLabel(`Compare baseline scenario ${baselinePathogenOption} against`);
  await expect(scenarioSelect).toBeVisible();

  // No options should be pre-selected
  await expect(page.getByRole("button", { name: "Covid-19 wild-type" })).toHaveCount(0);

  // Open the select
  await scenarioSelect.click();

  await page.getByRole("option", { name: "Covid-19 wild-type" }).click();
  await page.getByRole("option", { name: "Covid-19 Omicron" }).click();

  // The two options should now be listed in the multi-select
  await expect(page.getByRole("button", { name: "Covid-19 wild-type" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Covid-19 Omicron" })).toBeVisible();

  // and they should no longer be among the options
  await expect(page.getByRole("option", { name: "Covid-19 wild-type" })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "Covid-19 Omicron" })).toHaveCount(0);

  await page.getByRole("button", { name: "Compare", exact: true }).click();
  if (isMobile) { // For unknown reasons, in this test, mobile browsers require an extra click to start the comparison
    await page.getByRole("button", { name: "Compare", exact: true }).click();
  }

  await page.waitForURL(new RegExp(`${baseURL}/comparison\?.*`));
  const comparisonUrl = page.url();
  expect(comparisonUrl).toContain("axis=pathogen");
  expect(comparisonUrl).toContain("baseline=sars_cov_1");
  expect(comparisonUrl).toMatch(new RegExp(`runIds=${runIdMatcher};${runIdMatcher};${runIdMatcher}`));
  await expect(page.getByText("Explore by disease")).toBeVisible();

  // Results
  await expect(page.locator("#compareCostsChartContainer text.highcharts-credits").first()).toBeVisible();

  const costsChartDataUsdStr = await page.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartDataUsd = JSON.parse(costsChartDataUsdStr!);

  // There should be 3 columns in the chart (vertical, one for each scenario), and 3 series (horizontal, one for each top-level cost).
  // Each series will have 3 data points, one for each column.
  expect(costsChartDataUsd).toHaveLength(3);
  const gdpSeries = costsChartDataUsd[0];
  const educationSeries = costsChartDataUsd[1];
  const lifeYearsSeries = costsChartDataUsd[2];
  expect(gdpSeries.data.length).toBe(3);
  expect(gdpSeries.data.map((dataPoint: any) => dataPoint.name)).toEqual(["GDP", "GDP", "GDP"]);
  checkValueIsInRange(gdpSeries.data[0].y, 6_700_000, costTolerance);
  checkValueIsInRange(gdpSeries.data[1].y, 5_500_000, costTolerance);
  checkValueIsInRange(gdpSeries.data[2].y, 5_300_000, costTolerance);
  checkValueIsInRange(gdpSeries.data[0].custom.costAsGdpPercent, 34, costTolerance);
  checkValueIsInRange(gdpSeries.data[1].custom.costAsGdpPercent, 28, costTolerance);
  checkValueIsInRange(gdpSeries.data[2].custom.costAsGdpPercent, 27, costTolerance);

  expect(educationSeries.data.length).toBe(3);
  expect(educationSeries.data.map((dataPoint: any) => dataPoint.name)).toEqual(["Education", "Education", "Education"]); // Not you, Tony!
  checkValueIsInRange(educationSeries.data[0].y, 4_700_000, costTolerance);
  checkValueIsInRange(educationSeries.data[1].y, 3_900_000, costTolerance);
  checkValueIsInRange(educationSeries.data[2].y, 3_800_000, costTolerance);
  checkValueIsInRange(educationSeries.data[0].custom.costAsGdpPercent, 23, costTolerance);
  checkValueIsInRange(educationSeries.data[1].custom.costAsGdpPercent, 20, costTolerance);
  checkValueIsInRange(educationSeries.data[2].custom.costAsGdpPercent, 19, costTolerance);

  expect(lifeYearsSeries.data.length).toBe(3);
  expect(lifeYearsSeries.data.map((dataPoint: any) => dataPoint.name)).toEqual(["Life years", "Life years", "Life years"]);
  checkValueIsInRange(lifeYearsSeries.data[0].y, 45_000_000, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[1].y, 5_800_000, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[2].y, 3_100_000, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[0].custom.costAsGdpPercent, 227, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[1].custom.costAsGdpPercent, 29, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[2].custom.costAsGdpPercent, 16, costTolerance);

  const expandCostsTableButton = page.getByTestId("toggle-costs-table");
  await expandCostsTableButton.click();
  const tableRows = page.locator("#costs-table-body tr");

  [
    "Total losses",
    "GDP",
    "Closures",
    "Absences",
    "Education",
    "Closures",
    "Absences",
    "Life years",
    "Preschool-age children",
    "School-age children",
    "Working-age adults",
    "Retirement-age adults",
  ].forEach(async (label, i) => {
    const row = tableRows.nth(i);
    await expect(row).toHaveText(new RegExp(`${label}`
      + `\\s*${commaSeparatedNumberMatcher}`
      + `\\s*${commaSeparatedNumberMatcher}`
      + `\\s*${commaSeparatedNumberMatcher}`),
    );
  });

  // Check that after toggling the cost basis we see different data.
  await page.getByLabel("as % of pre-pandemic GDP").check();
  const costsChartDataGdpStr = await page.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartDataGdp = JSON.parse(costsChartDataGdpStr!);
  expect(costsChartDataGdp).toHaveLength(3);
  checkBarChartDataIsDifferent(costsChartDataUsd, costsChartDataGdp);
  expect(await tableRows.nth(0).textContent()).toMatch(new RegExp(`Total losses\\s*${decimalPercentMatcher}\\s*${decimalPercentMatcher}\\s*${decimalPercentMatcher}`));

  await page.getByRole("tab", { name: "Time series" }).click();

  const totalTimeSeries = ["Prevalence", "Hospital demand", "Dead", "Vaccinated"];
  const dailyTimeSeries = ["New infections", "New hospitalisations", "New deaths", "New vaccinations"];
  totalTimeSeries.forEach(async (label) => {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  });
  dailyTimeSeries.forEach(async (label) => {
    expect(page.getByText(label, { exact: true })).not.toBeVisible();
  });
  const hospitalCapacityPlotLineText = "Hospital surge capacity: 305,000";
  expect(page.getByText(hospitalCapacityPlotLineText)).not.toBeVisible();
  await page.locator("#hospitalisationsShowCapacitiesSwitch").check();
  await expect(page.getByText(hospitalCapacityPlotLineText)).toBeVisible();

  const infectionsLocator = page.locator("#time-series-comparison-0");
  assertTimeSeriesPresent(page, infectionsLocator);
  await expect(page.locator("#time-series-comparison-0 .highcharts-plot-band")).toHaveCount(2);
  await expect(infectionsLocator.getByLabel("View chart menu, Chart")).toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(infectionsLocator, [33_000_000, 48_000_000, 80_000_000]);

  const hospitalisationsLocator = page.locator("#time-series-comparison-1");
  assertTimeSeriesPresent(page, hospitalisationsLocator);
  await expect(page.locator("#time-series-comparison-1 .highcharts-plot-band")).toHaveCount(2);
  await expect(hospitalisationsLocator.getByLabel("View chart menu, Chart")).toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(hospitalisationsLocator, [14_000_000, 3_400_000, 1_200_000]);

  const deathsLocator = page.locator("#time-series-comparison-2");
  assertTimeSeriesPresent(page, deathsLocator);
  await expect(page.locator("#time-series-comparison-2 .highcharts-plot-band")).toHaveCount(0);
  await expect(deathsLocator.getByLabel("View chart menu, Chart")).toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(deathsLocator, [18_000_000, 4_600_000, 2_900_000]);

  const vaccinationsLocator = page.locator("#time-series-comparison-3");
  assertTimeSeriesPresent(page, vaccinationsLocator);
  await expect(page.locator("#time-series-comparison-3 .highcharts-plot-band")).toHaveCount(0);
  await expect(vaccinationsLocator.getByLabel("View chart menu, Chart")).toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(vaccinationsLocator, [135_000_000, 155_000_000, 153_000_000]);

  await page.locator("#dailySwitch").check();
  await page.waitForTimeout(1000); // Wait for charts to update
  totalTimeSeries.forEach(async (label) => {
    await expect(page.getByText(label, { exact: true })).not.toBeVisible();
  });
  dailyTimeSeries.forEach(async (label) => {
    expect(page.getByText(label, { exact: true })).toBeVisible();
  });

  await expect(infectionsLocator.locator(".highcharts-plot-band")).toHaveCount(2);
  await expect(infectionsLocator.locator(".highcharts-plot-line")).not.toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(infectionsLocator, [7_400_000, 19_000_000, 48_000_000]);

  await expect(hospitalisationsLocator.locator(".highcharts-plot-band")).toHaveCount(2);
  await expect(hospitalisationsLocator.locator(".highcharts-plot-line")).not.toBeVisible();
  await expect(page.locator("#hospitalisationsShowCapacitiesSwitch")).not.toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(hospitalisationsLocator, [1_100_000, 460_000, 340_000]);

  await expect(deathsLocator.locator(".highcharts-plot-band")).toHaveCount(0);
  await expect(deathsLocator.locator(".highcharts-plot-line")).not.toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(deathsLocator, [260_000, 100_000, 90_000]);

  await expect(vaccinationsLocator.locator(".highcharts-plot-band")).toHaveCount(0);
  await expect(vaccinationsLocator.locator(".highcharts-plot-line")).not.toBeVisible();
  await checkMultiScenarioTimeSeriesDataPoints(vaccinationsLocator, [1_300_000, 1_400_000, 1_400_000]);

  // Test we can navigate back to baseline scenario
  await page.getByRole("link", { name: "Baseline scenario" }).first().click();
  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  expect(page.url()).toEqual(urlOfBaselineScenario);

  // Create a new incognito browser context and a new page in that pristine context
  const newContext = await context.browser()?.newContext();
  const newPage = await context.newPage();

  // Test that we can see the comparison we recently created, even without a shared browser session.
  await newPage.goto(comparisonUrl);
  await expect(newPage.getByText("Explore by disease")).toBeVisible();
  const costsChartDataStr = await newPage.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartData = JSON.parse(costsChartDataStr!);
  expect(costsChartData).toHaveLength(3);
  newContext?.close();
});
