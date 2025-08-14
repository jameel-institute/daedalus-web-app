import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import { parameterLabels, runIdMatcher, scenarioPathMatcher } from "./helpers/constants";
import checkValueIsInRange from "./helpers/checkValueIsInRange";
import checkBarChartDataIsDifferent from "./helpers/checkBarChartDataIsDifferent";

const baselinePathogenOption = "SARS 2004";
const costTolerance = 0.25;

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
  checkValueIsInRange(gdpSeries.data[0].y, 5450462, costTolerance);
  checkValueIsInRange(gdpSeries.data[1].y, 5264213, costTolerance);
  checkValueIsInRange(gdpSeries.data[2].y, 5372804, costTolerance);
  checkValueIsInRange(gdpSeries.data[0].custom.costAsGdpPercent, 27, costTolerance);
  checkValueIsInRange(gdpSeries.data[1].custom.costAsGdpPercent, 27, costTolerance);
  checkValueIsInRange(gdpSeries.data[2].custom.costAsGdpPercent, 27, costTolerance);

  expect(educationSeries.data.length).toBe(3);
  expect(educationSeries.data.map((dataPoint: any) => dataPoint.name)).toEqual(["Education", "Education", "Education"]); // Not you, Tony!
  checkValueIsInRange(educationSeries.data[0].y, 3803153, costTolerance);
  checkValueIsInRange(educationSeries.data[1].y, 3801059, costTolerance);
  checkValueIsInRange(educationSeries.data[2].y, 3833417, costTolerance);
  checkValueIsInRange(educationSeries.data[0].custom.costAsGdpPercent, 19, costTolerance);
  checkValueIsInRange(educationSeries.data[1].custom.costAsGdpPercent, 19, costTolerance);
  checkValueIsInRange(educationSeries.data[2].custom.costAsGdpPercent, 19, costTolerance);

  expect(lifeYearsSeries.data.length).toBe(3);
  expect(lifeYearsSeries.data.map((dataPoint: any) => dataPoint.name)).toEqual(["Life years", "Life years", "Life years"]);
  checkValueIsInRange(lifeYearsSeries.data[0].y, 26351147, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[1].y, 4390694, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[2].y, 2489446, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[0].custom.costAsGdpPercent, 132, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[1].custom.costAsGdpPercent, 22, costTolerance);
  checkValueIsInRange(lifeYearsSeries.data[2].custom.costAsGdpPercent, 12, costTolerance);

  // Check that after toggling the cost basis we see different data.
  await page.getByLabel("as % of 2018 GDP").check();
  const costsChartDataGdpStr = await page.locator("#compareCostsChartContainer").getAttribute("data-summary");
  const costsChartDataGdp = JSON.parse(costsChartDataGdpStr!);
  expect(costsChartDataGdp).toHaveLength(3);
  checkBarChartDataIsDifferent(costsChartDataUsd, costsChartDataGdp);

  // Test we can navigate back to baseline scenario
  await page.getByRole("link", { name: "Baseline scenario" }).first().click();
  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));
  expect(page.url()).toEqual(urlOfBaselineScenario);
});
