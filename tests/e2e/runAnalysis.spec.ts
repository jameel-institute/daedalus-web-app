import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

const parameterLabels = {
  country: "Country",
  pathogen: "Disease",
  response: "Response",
  vaccine: "Global vaccine investment",
  hospital_capacity: "Hospital surge capacity",
};

const philippinesMinimumHospitalCapacity = "16300";
const scenarioPathMatcher = "scenarios/[a-f0-9]{32}";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL, headless }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.2/)).toHaveCount(1);

  await page.selectOption(`select[aria-label="${parameterLabels.pathogen}"]`, { label: "SARS 2004" });
  await page.selectOption(`select[aria-label="${parameterLabels.response}"]`, { label: "Elimination" });

  const initialCountryValue = await page.inputValue(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(initialCountryValue);
  await page.selectOption(`select[aria-label="${parameterLabels.country}"]`, { label: "United States" });
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
  await expect(page.getByText("305000").first()).toBeVisible();

  // To regenerate these screenshots:
  // 1. Insert a generous timeout so that screenshots are of the final chart, not the chart half-way through
  //    its initialization animation: `await page.waitForTimeout(15000);`
  // 2. Run the test with this flag: `npm run test:e2e -- --update-snapshots`
  // Alternatively, simply delete the screenshots directory and run the test as normal - it will 'fail' the first time.
  if (headless) {
    await page.waitForTimeout(1000); // Reduce flakeyness by waiting longer for charts to have finished rendering.
    await expect(page.locator(".highcharts-background").first()).toHaveScreenshot("first-time-series.png", { maxDiffPixelRatio: 0.04 });
    await expect(page.locator(".highcharts-background").nth(1)).toHaveScreenshot("second-time-series.png", { maxDiffPixelRatio: 0.04 });
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series.png", { maxDiffPixelRatio: 0.04 });

    // Test re-sizing of the charts
    await page.getByRole("button", { name: "Community infections" }).click();
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series-taller.png", { maxDiffPixelRatio: 0.04 });
    await page.getByRole("button", { name: "Hospital demand" }).click();
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series-tallest.png", { maxDiffPixelRatio: 0.04 });
  } else {
    // eslint-disable-next-line no-console
    console.log("Running in Headed mode, no screenshot comparison");
  }

  // Run a second analysis with a different parameter.
  await page.getByRole("button", { name: "Parameters" }).first().click();
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();

  await expect(page.getByLabel(parameterLabels.country)).toHaveValue("United States");
  await expect(page.getByLabel(parameterLabels.pathogen)).toHaveValue("sars_cov_1");
  await expect(page.getByLabel(parameterLabels.response)).toHaveValue("elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("305000");

  await page.selectOption(`select[aria-label="${parameterLabels.country}"]`, { label: "Philippines" });
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
  await expect(page.getByText(philippinesMinimumHospitalCapacity).first()).toBeVisible();

  // Test that the second analysis results page has the correct parameters within the parameters form modal.
  await page.getByRole("button", { name: "Parameters" }).first().click();
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();
  await expect(page.getByLabel(parameterLabels.country)).toHaveValue("Philippines");
  await expect(page.getByLabel(parameterLabels.pathogen)).toHaveValue("sars_cov_1");
  await expect(page.getByLabel(parameterLabels.response)).toHaveValue("elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(philippinesMinimumHospitalCapacity);
  const closeButton = page.getByRole("button", { name: "Close" });
  await closeButton.click();

  if (headless) { // Test that a chart is different from the first run.
    await page.waitForTimeout(1000);
    await expect(page.locator(".highcharts-background").first()).toHaveScreenshot("philippines-infections.png", { maxDiffPixelRatio: 0.04 });
  };

  // Test that the user can navigate to previously-run analyses.
  await page.goto(urlOfFirstAnalysis);
  await page.waitForURL(urlOfFirstAnalysis);
  await expect(page.getByLabel(parameterLabels.country)).toHaveValue("United States");
  if (headless) {
    await page.waitForTimeout(1000);
    await expect(page.locator(".highcharts-background").first()).toHaveScreenshot("first-time-series.png", { maxDiffPixelRatio: 0.04 });
  };

  // Test that, after arriving to the web app from the /scenarios/:id URL, the user can still navigate
  // to the home page: this has broken in the past.
  await page.goto(urlOfFirstAnalysis);
  await page.getByRole("button", { name: "DAEDALUS Explore" }).click();
  await page.waitForURL(`${baseURL}/scenarios/new`);
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();
});
