import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export default async (page: Page, baseURL: string | undefined) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  // Reduce flakeyness of tests by waiting for evidence that the page has mounted.
  await expect(page.getByText(/Country/)).toBeVisible();
};
