import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";

const scenarioPathMatcher = "scenarios/[a-f0-9]{32}";
const baselinePathogenOption = "SARS 2004";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);

  await page.click('button:has-text("Run")');

  await page.waitForURL(new RegExp(`${baseURL}/${scenarioPathMatcher}`));

  await expect(page.getByText(baselinePathogenOption).first()).toBeVisible();
  await expect(page.getByText("No closures").first()).toBeVisible();
  await expect(page.getByText("Thailand").first()).toBeVisible();
  await expect(page.getByText("None").first()).toBeVisible();
  await expect(page.getByText("22,000").first()).toBeVisible();

  // Run a second analysis with a different parameter, using the parameters form on the results page.
  await page.getByRole("button", { name: "Compare against other scenarios" }).first().click();
  await expect(page.getByRole("heading", { name: "Start a comparison against this baseline" })).toBeVisible();

  await page.getByRole("button", { name: "Disease" }).first().click();

  const scenarioSelect = page.getByRole("combobox", { name: `Compare baseline scenario ${baselinePathogenOption} against: ` }).locator(".multi-value");
  expect(scenarioSelect).toHaveText("");
  scenarioSelect.click();
  await page.getByRole("option", { name: "Covid-19 wild-type" }).click();
  expect(scenarioSelect).toHaveText("Covid-19 wild-type");
  await page.getByRole("option", { name: "Covid-19 Omicron" }).click();
  expect(scenarioSelect).toHaveText("Covid-19 wild-type Covid-19 Omicron");

  await page.click('button:has-text("Compare")');

  await page.waitForURL(`${baseURL}/comparison`);
  await expect(page.getByText("Comparison")).toBeVisible();

  await expect(page.getByText("Disease (Axis)").first()).toBeVisible();

  await expect(page.getByText(`${baselinePathogenOption} (Baseline)`).first()).toBeVisible();
  await expect(page.getByText("Covid-19 wild-type").first()).toBeVisible();
  await expect(page.getByText("Covid-19 Omicron").first()).toBeVisible();
  await expect(page.getByText("No closures").first()).toBeVisible();
  await expect(page.getByText("Thailand").first()).toBeVisible();
  await expect(page.getByText("None").first()).toBeVisible();
  await expect(page.getByText("22,000").first()).toBeVisible();
});
