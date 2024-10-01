import { expect, test } from "@playwright/test";
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

test("Can request a scenario analysis run", async ({ page, baseURL, headless }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.1/)).toHaveCount(1);

  await page.selectOption(`select[aria-label="${parameterLabels.pathogen}"]`, { label: "Influenza 1957" });
  await page.selectOption(`select[aria-label="${parameterLabels.response}"]`, { label: "Elimination" });

  const initialCountryValue = await page.inputValue(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`);
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue(initialCountryValue);
  await page.selectOption(`select[aria-label="${parameterLabels.country}"]`, { label: "United States" });
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).not.toHaveValue(initialCountryValue);

  await page.click(`div[aria-label="${parameterLabels.vaccine}"] label[for="medium"]`);
  await page.fill(`input[aria-label="${parameterLabels.hospital_capacity}"][type="number"]`, "200000");

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  expect(page.url()).toMatch(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();

  await expect(page.getByText("Influenza 1957").first()).toBeVisible();
  await expect(page.getByText("Elimination").first()).toBeVisible();
  await expect(page.getByText("United States").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText("200000").first()).toBeVisible();

  // To regenerate these screenshots:
  // 1. Insert a generous timeout so that screenshots are of the final chart, not the chart half-way through
  //    its initialization animation: `await page.waitForTimeout(30000);`
  // 2. Run the test with this flag: `npm run test:e2e -- --update-snapshots`
  if (headless) {
    await expect(page.locator(".highcharts-background").first()).toHaveScreenshot("first-time-series.png", { maxDiffPixelRatio: 0.02 });
    await expect(page.locator(".highcharts-background").nth(1)).toHaveScreenshot("second-time-series.png", { maxDiffPixelRatio: 0.02 });
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series.png", { maxDiffPixelRatio: 0.02 });

    // Test re-sizing of the charts
    await page.getByRole("button", { name: "Community infections" }).click();
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series-taller.png", { maxDiffPixelRatio: 0.02 });
    await page.getByRole("button", { name: "Hospital demand" }).click();
    await expect(page.locator(".highcharts-background").nth(2)).toHaveScreenshot("third-time-series-tallest.png", { maxDiffPixelRatio: 0.02 });
  } else {
    // eslint-disable-next-line no-console
    console.log("Running in Headed mode, no screenshot comparison");
  }

  await page.getByRole("button", { name: "Parameters" }).first().click();
  await expect(page.getByRole("heading", { name: "Edit parameters" })).toBeVisible();

  await expect(page.getByLabel(parameterLabels.country)).toHaveValue("United States");
  await expect(page.getByLabel(parameterLabels.pathogen)).toHaveValue("influenza_1957");
  await expect(page.getByLabel(parameterLabels.response)).toHaveValue("elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("200000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("200000");

  await page.click(`div[aria-label="${parameterLabels.vaccine}"] label[for="high"]`);

  await page.click('button:has-text("Run")');

  await expect(page.getByText("High").first()).toBeVisible();
});
