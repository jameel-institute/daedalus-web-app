import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import { checkTimeSeriesDataPoints } from "./helpers/checkTimeSeriesDataPoints";
import { commaSeparatedNumberMatcher, costTolerance, decimalPercentMatcher, parameterLabels, scenarioPathMatcher } from "./helpers/constants";
import checkBarChartDataIsDifferent from "./helpers/checkBarChartDataIsDifferent";
import checkValueIsInRange from "./helpers/checkValueIsInRange";

const philippinesMinimumHospitalCapacity = "16300";
const philippinesMinimumHospitalCapacityFormatted = "16,300";

test.beforeAll(async () => {
  checkRApiServer();
});

const expectSelectParameterToHaveValueLabel = async (page: Page, parameterLabel: string, expectedValueLabel: string) => {
  await expect(page.getByRole("combobox", { name: parameterLabel }).locator(".single-value"))
    .toHaveText(expectedValueLabel);
};

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);

  await selectParameterOption(page, "pathogen", "SARS 2004");
  await selectParameterOption(page, "response", "Elimination");

  const initialHospitalCapacityValue = await page.inputValue(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(initialHospitalCapacityValue);
  await selectParameterOption(page, "country", "United States");
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).not.toHaveValue(initialHospitalCapacityValue);

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
  await expect(page.getByText(/\d{1,3}(\.\d+)?%of GDP/)).toBeVisible({ timeout: 20000 });
  // Check for USD$ headline figure
  await expect(page.getByText(/\$.*USD \d{1,3}\.\d[BTM]$/)).toBeVisible();

  await expect(page.locator("#prevalence-container")).toBeVisible();
  await page.locator("#prevalence-container").scrollIntoViewIfNeeded();
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#prevalence-container .highcharts-plot-band")).toHaveCount(2);
  await expect(page.locator("#prevalence-container").getByLabel("View chart menu, Chart")).toBeVisible();
  await checkTimeSeriesDataPoints(page.locator("#prevalence-container"), 33_000_000);

  // Check can toggle time series to "New per day" and back
  await expect(page.getByText("New per day").first()).toBeVisible();
  await page.locator("#infectionsDailySwitch").check();
  await checkTimeSeriesDataPoints(page.locator("#new_infected-container"), 7_500_000);
  await expect(page.getByRole("button", { name: "New infections" })).toBeVisible();
  await checkTimeSeriesDataPoints(page.locator("#new_infected-container"), 7_500_000);
  await page.locator("#infectionsDailySwitch").setChecked(false);
  await expect(page.getByRole("button", { name: "Prevalence" })).toBeVisible();

  await expect(page.locator("#hospitalised-container")).toBeVisible();
  await page.locator("#hospitalised-container").scrollIntoViewIfNeeded();
  await expect(page.locator("#hospitalised-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#hospitalised-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#hospitalised-container .highcharts-plot-band")).toHaveCount(2);
  await expect(page.locator("#hospitalised-container .highcharts-plot-line")).toBeInViewport();
  await expect(page.locator("#hospitalised-container").getByLabel("View chart menu, Chart")).toBeVisible();
  await checkTimeSeriesDataPoints(page.locator("#hospitalised-container"), 14_000_000);

  await page.locator("#hospitalisationsDailySwitch").check();
  await checkTimeSeriesDataPoints(page.locator("#new_hospitalised-container"), 1_000_000);
  await expect(page.getByRole("button", { name: "New hospitalisations" })).toBeVisible();
  await page.locator("#hospitalisationsDailySwitch").setChecked(false);

  await expect(page.locator("#dead-container")).toBeVisible();
  await expect(page.locator("#dead-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#dead-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#dead-container").getByLabel("View chart menu, Chart")).toBeVisible();
  await checkTimeSeriesDataPoints(page.locator("#dead-container"), 18_000_000);
  await page.locator("#deathsDailySwitch").check();
  await checkTimeSeriesDataPoints(page.locator("#new_dead-container"), 250_000);
  await expect(page.getByRole("button", { name: "New deaths" })).toBeVisible();
  await page.locator("#deathsDailySwitch").setChecked(false);

  await expect(page.locator("#vaccinated-container")).toBeVisible();
  await expect(page.locator("#vaccinated-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#vaccinated-container .highcharts-yaxis-labels")).toBeVisible();
  await expect(page.locator("#vaccinated-container").getByLabel("View chart menu, Chart")).toBeVisible();
  await checkTimeSeriesDataPoints(page.locator("#vaccinated-container"), 135_000_000);
  await page.locator("#vaccinationsDailySwitch").check();
  await checkTimeSeriesDataPoints(page.locator("#new_vaccinated-container"), 1_350_000);
  await expect(page.getByRole("button", { name: "New vaccinations" })).toBeVisible();
  await page.locator("#vaccinationsDailySwitch").setChecked(false);

  const prevalence1DataStr = await page.locator("#prevalence-container").getAttribute("data-summary");
  const prevalence1Data = JSON.parse(prevalence1DataStr!);
  const prevalenceTimeSeries1MaxValue = prevalence1Data.maxValue;

  await expect(page.locator("#costsChartContainer text.highcharts-credits").first()).toBeVisible();

  const costsChartDataUsdStr = await page.locator("#costsChartContainer").getAttribute("data-summary");
  const costsChartDataUsd = JSON.parse(costsChartDataUsdStr!);

  // Though there are 3 columns (vertical), there should be 4 series (horizontal).
  // Each series will have 3 data points, one for each column.
  expect(costsChartDataUsd).toHaveLength(4);
  expect(costsChartDataUsd[0].data.length).toBe(3);
  expect(costsChartDataUsd[0].data.map((dataPoint: any) => dataPoint.name)).toEqual(["Closures", "Closures", "Preschool-age children"]);
  expect(costsChartDataUsd[0].data.map((dataPoint: any) => dataPoint.custom.includeInTooltips)).toEqual([true, true, true]);
  checkValueIsInRange(costsChartDataUsd[0].data[0].y, 6_168_000, costTolerance);
  checkValueIsInRange(costsChartDataUsd[0].data[1].y, 4_648_000, costTolerance);
  checkValueIsInRange(costsChartDataUsd[0].data[2].y, 2_994_000, costTolerance);

  expect(costsChartDataUsd[1].data.length).toBe(3);
  expect(costsChartDataUsd[1].data.map((dataPoint: any) => dataPoint.name)).toEqual(["Absences", "Absences", "School-age children"]);
  expect(costsChartDataUsd[1].data.map((dataPoint: any) => dataPoint.custom.includeInTooltips)).toEqual([true, true, true]);
  checkValueIsInRange(costsChartDataUsd[1].data[0].y, 514_000, costTolerance);
  checkValueIsInRange(costsChartDataUsd[1].data[1].y, 8_000, costTolerance);
  checkValueIsInRange(costsChartDataUsd[1].data[2].y, 25_984_000, costTolerance);

  expect(costsChartDataUsd[2].data.length).toBe(3);
  expect(costsChartDataUsd[2].data.map((dataPoint: any) => dataPoint.name)).toEqual(["", "", "Working-age adults"]);
  expect(costsChartDataUsd[2].data.map((dataPoint: any) => dataPoint.custom.includeInTooltips)).toEqual([false, false, true]);
  expect(costsChartDataUsd[2].data[0].y).toEqual(0);
  expect(costsChartDataUsd[2].data[1].y).toEqual(0);
  checkValueIsInRange(costsChartDataUsd[2].data[2].y, 9_645_000, costTolerance);

  expect(costsChartDataUsd[3].data.length).toBe(3);
  expect(costsChartDataUsd[3].data.map((dataPoint: any) => dataPoint.name)).toEqual(["", "", "Retirement-age adults"]);
  expect(costsChartDataUsd[3].data.map((dataPoint: any) => dataPoint.custom.includeInTooltips)).toEqual([false, false, true]);
  expect(costsChartDataUsd[3].data[0].y).toEqual(0);
  expect(costsChartDataUsd[3].data[1].y).toEqual(0);
  checkValueIsInRange(costsChartDataUsd[3].data[2].y, 6_412_000, costTolerance);

  const expandCostsTableButton = page.getByTestId("toggle-costs-table");
  await expandCostsTableButton.click();
  const tableRows = page.locator("#costs-table-body tr");
  expect(await tableRows.nth(0).textContent()).toMatch(new RegExp(`GDP\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(1).textContent()).toMatch(new RegExp(`Closures\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(2).textContent()).toMatch(new RegExp(`Absences\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(3).textContent()).toMatch(new RegExp(`Education\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(4).textContent()).toMatch(new RegExp(`Closures\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(5).textContent()).toMatch(new RegExp(`Absences\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(6).textContent()).toMatch(new RegExp(`Life years\\*\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(7).textContent()).toMatch(new RegExp(`Preschool-age children\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(8).textContent()).toMatch(new RegExp(`School-age children\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(9).textContent()).toMatch(new RegExp(`Working-age adults\\s*${commaSeparatedNumberMatcher}`));
  expect(await tableRows.nth(10).textContent()).toMatch(new RegExp(`Retirement-age adults\\s*${commaSeparatedNumberMatcher}`));

  [
    "GDP",
    "Closures",
    "Absences",
    "Education",
    "Closures",
    "Absences",
    "Life years\\*",
    "Preschool-age children",
    "School-age children",
    "Working-age adults",
    "Retirement-age adults",
  ].forEach(async (label, i) => {
    const row = tableRows.nth(i);
    await expect(row).toHaveText(new RegExp(`${label}\\s*${commaSeparatedNumberMatcher}`));
  });

  // Check that after toggling the cost basis we see different data.
  await page.getByLabel("as % of pre-pandemic GDP").check();
  const costsChartDataGdpStr = await page.locator("#costsChartContainer").getAttribute("data-summary");
  const costsChartDataGdp = JSON.parse(costsChartDataGdpStr!);
  expect(costsChartDataGdp).toHaveLength(4);
  checkBarChartDataIsDifferent(costsChartDataUsd, costsChartDataGdp);
  expect(await tableRows.nth(0).textContent()).toMatch(new RegExp(`GDP\\s*${decimalPercentMatcher}`));

  // Run a second analysis with a different parameter, using the parameters form on the results page.
  await page.getByRole("button", { name: "Parameters" }).first().click();
  // The following line has been known to fail locally on webkit, but pass on CI.
  await expect(page.getByRole("heading", { name: "Change parameters" })).toBeVisible();

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
  await expect(page.getByRole("heading", { name: "Change parameters" })).toBeVisible();
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.country, "Philippines");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.pathogen, "SARS 2004");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.response, "Elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  const closeButton = page.getByLabel("Change parameters").getByLabel("Close");
  await closeButton.click();

  // Test that the second analysis results page has visible time series and bar charts.
  await expect(page.locator("#prevalence-container")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#costsChartContainer text.highcharts-credits").first()).toBeVisible();

  // Test that one of the time series charts for the second analysis has different data from the first analysis.
  const prevalence2DataStr = await page.locator("#prevalence-container").getAttribute("data-summary");
  const prevalence2Data = JSON.parse(prevalence2DataStr!);
  const prevalenceTimeSeries2MaxValue = prevalence2Data.maxValue;
  expect(prevalenceTimeSeries2MaxValue).not.toEqual(prevalenceTimeSeries1MaxValue);

  // Test that the second analysis' costs bar chart has different data from the first analysis.
  const costsChart2DataStr = await page.locator("#costsChartContainer").getAttribute("data-summary");
  const costsChart2Data = JSON.parse(costsChart2DataStr!);
  expect(costsChart2Data).toHaveLength(4);
  checkBarChartDataIsDifferent(costsChartDataUsd, costsChart2Data);
  checkBarChartDataIsDifferent(costsChartDataGdp, costsChart2Data);

  // Test that the second analysis retains the user's preference for the "as % of GDP" cost basis.
  await expect(page.getByLabel("as % of pre-pandemic GDP")).toBeChecked();

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
