import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import { checkTimeSeriesDataPoints } from "./helpers/checkTimeSeriesDataPoints";
import { checkValueIsInRange } from "./helpers/checkValueIsInRange";

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

const expectSelectParameterToHaveValueLabel = async (page: Page, parameterLabel: string, expectedValueLabel: string) => {
  await expect(page.getByRole("combobox", { name: parameterLabel }).locator(".single-value"))
    .toHaveText(expectedValueLabel);
};

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
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

  const prevalence1DataStr = await page.locator("#prevalence-container").getAttribute("data-test");
  const prevalence1Data = JSON.parse(prevalence1DataStr!);
  const prevalenceTimeSeries1LastY = prevalence1Data.lastDataPoint[1];

  await checkTimeSeriesDataPoints(page.locator("#prevalence-container"), [1, 331.0026], [600, 110_000]);
  await checkTimeSeriesDataPoints(page.locator("#hospitalised-container"), [1, 0], [600, 55_000]);
  await checkTimeSeriesDataPoints(page.locator("#dead-container"), [1, 0], [600, 800_000]);
  await checkTimeSeriesDataPoints(page.locator("#vaccinated-container"), [1, 0], [600, 200_000_000]);

  await expect(page.locator("#costsChartContainer rect").first()).toBeVisible();

  const costsPieDataStr = await page.locator("#costsChartContainer").getAttribute("data-test");
  const costsPieData = JSON.parse(costsPieDataStr!);
  expect(costsPieData).toHaveLength(12);

  const expectedCostData = [
    { id: "total", parent: "", name: "Total", value: 16_000_000 },
    { id: "gdp", parent: "total", name: "GDP", value: 8_000_000 },
    { id: "education", parent: "total", name: "Education", value: 6_000_000 },
    { id: "life_years", parent: "total", name: "Life years", value: 2_250_000 },
    { id: "gdp_closures", parent: "gdp", name: "Closures", value: 8_000_000 },
    { id: "gdp_absences", parent: "gdp", name: "Absences", value: 50_000 },
    { id: "education_closures", parent: "education", name: "Closures", value: 6_000_000 },
    { id: "education_absences", parent: "education", name: "Absences", value: 100 },
    { id: "life_years_pre_school", parent: "life_years", name: "Preschool-age children", value: 250_000 },
    { id: "life_years_school_age", parent: "life_years", name: "School-age children", value: 1_200_000 },
    { id: "life_years_working_age", parent: "life_years", name: "Working-age adults", value: 600_000 },
    { id: "life_years_retirement_age", parent: "life_years", name: "Retirement-age adults", value: 220_000 },
  ];

  expectedCostData.forEach((expectedCost) => {
    const cost = costsPieData.find((cost: any) => cost.id === expectedCost.id);
    expect(cost.name).toEqual(expectedCost.name);
    expect(cost.parent).toBe(expectedCost.parent);
    checkValueIsInRange(cost.value, expectedCost.value, 0.5);
  });

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

  // Test that the second analysis results page has visible charts of both types.
  await expect(page.locator("#prevalence-container")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#prevalence-container .highcharts-xaxis-labels")).toBeVisible();
  await expect(page.locator("#costsChartContainer rect").first()).toBeVisible();

  // Test that one of the time series charts for the second analysis has different data from the first analysis.
  const prevalence2DataStr = await page.locator("#prevalence-container").getAttribute("data-test");
  const prevalence2Data = JSON.parse(prevalence2DataStr!);
  const prevalenceTimeSeries2LastY = prevalence2Data.lastDataPoint[1];
  expect(prevalenceTimeSeries2LastY).not.toEqual(prevalenceTimeSeries1LastY);

  // Test that the second analysis' costs pie chart has different data from the first.
  const costsPie2DataStr = await page.locator("#costsChartContainer").getAttribute("data-test");
  const costsPie2Data = JSON.parse(costsPie2DataStr!);
  expect(costsPie2Data).toHaveLength(12);
  costsPie2Data.forEach((cost: any, index: number) => {
    expect(cost.value).not.toEqual(costsPieData[index].value);
  });

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
