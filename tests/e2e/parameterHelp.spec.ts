import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";

test("can see expected parameter help", async ({ page, baseURL }) => {
  await waitForNewScenarioPage(page, baseURL);
  // parameter header help
  const parameterHelpIcon = page.locator(".select-container:has-text('Country') img.help-icon");
  await parameterHelpIcon.hover();
  const tooltip = page.locator(".tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(/Select a country/);
  await page.mouse.move(0, 0); // unhover
  await expect(tooltip).not.toBeVisible();

  // radio button help
  await page.getByText("None").hover();
  await expect(tooltip).toHaveText(/An investment level corresponding to: vaccine rollout commencing 365 days after the outbreak/);

  // dropdown option help
  const selectContainer = page.locator(".select-container:has-text('Response')");
  await selectContainer.locator("button.dropdown-icon").click();
  const option = selectContainer.locator(":nth-match(.parameter-option, 1)");
  await expect(option).toHaveText(/No pandemic mitigation: all sectors are fully open/);
});
