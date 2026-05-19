import { expect, type Page, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import { parameterLabels } from "./helpers/constants";
import selectParameterOption from "./helpers/selectParameterOption";

test.beforeAll(async () => {
  checkRApiServer();
});

const expectSelectParameterToHaveValueLabel = async (page: Page, parameterLabel: string, expectedValueLabel: string) => {
  await expect(page.getByRole("combobox", { name: parameterLabel }).locator(".single-value"))
    .toHaveText(expectedValueLabel);
};

test("Has custom default values", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);

  await expectSelectParameterToHaveValueLabel(page, parameterLabels.country, "Vietnam");
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.response, "Elimination");
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("38000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("38000");
});

test("Blocks certain parameter combinations and shows a modal", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);

  // Check that the blocked option of response=School closures shows the modal and resets to allowed defaults
  await selectParameterOption(page, "response", "School closures");
  await expect(page.getByRole("heading", { name: "This parameter is temporarily disabled" })).toBeVisible();
  await expectSelectParameterToHaveValueLabel(page, parameterLabels.response, "Elimination");

  await page.click(".btn-close");
  await expect(page.getByRole("heading", { name: "This parameter is temporarily disabled" })).not.toBeVisible();

  await page.click(`div[aria-label="${parameterLabels.behaviour}"] label[for="behaviour-medium"]`);
  await expect(page.getByRole("heading", { name: "This parameter is temporarily disabled" })).toBeVisible();
  await expect(page.getByTestId("select-group-behaviour").getByLabel("None")).toBeChecked();
});
