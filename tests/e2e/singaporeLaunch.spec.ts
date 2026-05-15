import { expect, type Page, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";
import checkRApiServer from "./helpers/checkRApiServer";
import { parameterLabels } from "./helpers/constants";

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
  await expect(page.getByRole("spinbutton", { name: parameterLabels.hospital_capacity })).toHaveValue("32000");
  await expect(page.getByRole("slider", { name: parameterLabels.hospital_capacity })).toHaveValue("32000");
});
