import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import selectParameterOption from "~/tests/e2e/helpers/selectParameterOption";
import { parameterLabels, scenarioPathMatcher } from "./helpers/constants";

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

  await page.waitForURL(`${baseURL}/comparison?`
    + `country=USA`
    + `&pathogen=sars_cov_1`
    + `&response=elimination`
    + `&vaccine=medium`
    + `&hospital_capacity=305000`
    + `&axis=pathogen`
    + `&scenarios=sars_cov_2_pre_alpha;sars_cov_2_omicron`,
  );
  await expect(page.getByText("Comparison")).toBeVisible();

  await expect(page.getByText("pathogen (Axis)").first()).toBeVisible();
  await expect(page.getByText(`sars_cov_1 (Baseline)`).first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_pre_alpha").first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_omicron").first()).toBeVisible();
  await expect(page.getByText("elimination")).toHaveCount(3);
  await expect(page.getByText("USA")).toHaveCount(3);
  await expect(page.getByText("medium")).toHaveCount(3);
  await expect(page.getByText("305000")).toHaveCount(3);
});

test("Can compare multiple scenarios by following a link", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/comparison?`
    + `country=USA`
    + `&pathogen=sars_cov_1`
    + `&response=elimination`
    + `&vaccine=medium`
    + `&hospital_capacity=305000`
    + `&axis=pathogen`
    + `&scenarios=sars_cov_2_pre_alpha;sars_cov_2_omicron`,
  );
  await expect(page.getByText("Comparison")).toBeVisible();

  await expect(page.getByText("pathogen (Axis)").first()).toBeVisible();
  await expect(page.getByText(`sars_cov_1 (Baseline)`).first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_pre_alpha").first()).toBeVisible();
  await expect(page.getByText("sars_cov_2_omicron").first()).toBeVisible();
  await expect(page.getByText("elimination")).toHaveCount(3);
  await expect(page.getByText("USA")).toHaveCount(3);
  await expect(page.getByText("medium")).toHaveCount(3);
  await expect(page.getByText("305000")).toHaveCount(3);
});
