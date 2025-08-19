import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import { costTolerance, parameterLabels, runIdMatcher, scenarioPathMatcher } from "./helpers/constants";
import checkValueIsInRange from "./helpers/checkValueIsInRange";
import checkBarChartDataIsDifferent from "./helpers/checkBarChartDataIsDifferent";

const baselinePathogenOption = "SARS 2004";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can compare multiple scenarios", async ({ page, baseURL }) => {
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

  await page.waitForURL(new RegExp(`${baseURL}/comparison\?.*`));
  const comparisonUrl = page.url();
  expect(comparisonUrl).toContain("axis=pathogen");
  expect(comparisonUrl).toContain("baseline=sars_cov_1");
  expect(comparisonUrl).toMatch(new RegExp(`runIds=${runIdMatcher};${runIdMatcher};${runIdMatcher}`));
  await expect(page.getByText("Explore by disease")).toBeVisible();

  // Parameters
  await expect(page.getByText("pathogen (Axis)").first()).toBeVisible();
  await expect(page.getByText(`sars_cov_1 (Baseline)`).first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_pre_alpha").first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_omicron").first()).toBeVisible();
  await expect(page.getByText("elimination").first()).toBeVisible();
  await expect(page.getByText("USA").first()).toBeVisible();
  await expect(page.getByText("medium").first()).toBeVisible();
  await expect(page.getByText("305000").first()).toBeVisible();
  // Run ids
  await expect(page.getByText(/[a-f0-9]{8}\.\.\./)).toHaveCount(3);
  // Results
  await expect(page.locator("#compareCostsChartContainer text.highcharts-credits").first()).toBeVisible();

  const costsChartDataUsdStr = await page.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartDataUsd = JSON.parse(costsChartDataUsdStr!);

  // There should be 3 columns (vertical, one for each scenario), and 3 series (horizontal, one for each top-level cost).
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
  expect(await tableRows.nth(0).textContent()).toMatch(/Total losses.*35,605,000.*13,456,000.*11,696,000/);
  expect(await tableRows.nth(1).textContent()).toMatch(/GDP.*5,450,000.*5,264,000.*5,373,000/);
  expect(await tableRows.nth(2).textContent()).toMatch(/Closures.*5,036,000.*5,036,000.*5,076,000/);
  expect(await tableRows.nth(3).textContent()).toMatch(/Absences.*414,000.*228,000.*296,000/);
  expect(await tableRows.nth(4).textContent()).toMatch(/Education.*3,803,000.*3,801,000.*3,833,000/);
  expect(await tableRows.nth(5).textContent()).toMatch(/Closures.*3,795,000.*3,795,000.*3,826,000/);
  expect(await tableRows.nth(6).textContent()).toMatch(/Absences.*8,000.*6,000.*8,000/);
  expect(await tableRows.nth(7).textContent()).toMatch(/Life years.*26,351,000.*4,391,000.*2,489,000/);
  expect(await tableRows.nth(8).textContent()).toMatch(/Preschool-age children.*1,612,000.*3,000.*8,000/);
  expect(await tableRows.nth(9).textContent()).toMatch(/School-age children.*15,079,000.*1,882,000.*709,000/);
  expect(await tableRows.nth(10).textContent()).toMatch(/Working-age adults.*5,756,000.*41,000.*81,000/);
  expect(await tableRows.nth(11).textContent()).toMatch(/Retirement-age adults.*3,904,000.*2,464,000.*1,692,000/);

  // Check that after toggling the cost basis we see different data.
  await page.getByText("as % of 2018 GDP").nth(1).check();
  const costsChartDataGdpStr = await page.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartDataGdp = JSON.parse(costsChartDataGdpStr!);
  expect(costsChartDataGdp).toHaveLength(3);
  checkBarChartDataIsDifferent(costsChartDataUsd, costsChartDataGdp);
  expect(await tableRows.nth(0).textContent()).toMatch(/Total losses.*179%.*67\.7%.*58\.9%/);

  // Test we can navigate back to baseline scenario
  await page.getByRole("link", { name: "Baseline scenario" }).first().click();
  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  expect(page.url()).toEqual(urlOfBaselineScenario);
});
