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

test("Can request a scenario analysis run", async ({ page, baseURL, isMobile }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByTitle(/Web app version: 0.0.2/)).toHaveCount(1);

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

  let parameterLocatorIndex = 0;
  if (isMobile) {
    await expect(page.getByText("Rotate your mobile device").first()).toBeVisible();
    await page.getByRole("button", { name: "Parameters" }).click();
    parameterLocatorIndex = 1;
  } else {
    await expect(page.getByText("Rotate your mobile device").first()).not.toBeVisible();
  }
  await expect(page.getByText("Influenza 1957").nth(parameterLocatorIndex)).toBeVisible();
  await expect(page.getByText("Elimination").nth(parameterLocatorIndex)).toBeVisible();
  await expect(page.getByText("United States").nth(parameterLocatorIndex)).toBeVisible();
  await expect(page.getByText("Medium").nth(parameterLocatorIndex)).toBeVisible();
  await expect(page.getByText("200000").nth(parameterLocatorIndex)).toBeVisible();

  if (isMobile) {
    await page.getByRole("link", { name: "Edit parameters" }).click();
  } else {
    await page.getByRole("button", { name: "Parameters" }).click();
  };
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  await expect(page.getByLabel(parameterLabels.country)).toHaveValue("United States");
  await expect(page.getByLabel(parameterLabels.pathogen)).toHaveValue("influenza_1957");
  await expect(page.getByLabel(parameterLabels.response)).toHaveValue("elimination");
  await expect(page.getByLabel("Medium")).toBeChecked();
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("200000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("200000");
});
