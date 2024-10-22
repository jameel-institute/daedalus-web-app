import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export default async (page: Page, parameterId: string, optionLabel: string) => {
  await page.click(`input#${parameterId}`);
  const option = await page.locator(`.parameter-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};
