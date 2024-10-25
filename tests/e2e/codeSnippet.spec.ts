import { expect, test } from "@playwright/test";
import waitForNewScenarioPage from "~/tests/e2e/helpers/waitForNewScenarioPage";

const expectedCodeSnippet = `model_result <- daedalus::daedalus(
  "THA",
  "sars_cov_1",
  response_strategy = "none",
  response_threshold = 22000,
  vaccine_investment = "none"
)`;

const browserSupportsClipboardPermissions = (browserName: string) => {
  // Not all browsers support setting clipboard permissions unfortunately, so we need to
  // skip the copy test for those
  return [
    "chromium",
    "Microsoft Edge",
    "Mobile Chrome",
    "Google Chrome",
  ].includes(browserName);
};

test("can see code snippet and copy to clipboard", async ({ page, browserName, baseURL, context }) => {
  await waitForNewScenarioPage(page, baseURL);
  // Run scenario with default parameters
  await page.click('button:has-text("Run")');
  await page.waitForURL(new RegExp(`${baseURL}/scenarios/[a-f0-9]{32}`));
  await page.waitForSelector("#btn-code-snippet");
  const snippetBtn = page.locator("#btn-code-snippet");
  expect(snippetBtn).toBeVisible();
  await snippetBtn.click(0);
  await expect(await page.getByText("DAEDALUS code snippet")).toBeVisible();
  await expect(await page.locator("pre")).toHaveText(expectedCodeSnippet);

  if (browserSupportsClipboardPermissions(browserName)) {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  } else {
    console.warn(`Browser ${browserName} does not support clipboard permissions`);
  }

  // Firefox doesn't support setting clipboard perms, but unlike webkit doesn't seem to require them!
  if (browserSupportsClipboardPermissions(browserName) || browserName === "firefox") {
    const copyBtn = page.getByText("Copy");
    await copyBtn.click();
    const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContent = await handle.jsonValue();
    expect(clipboardContent).toBe(expectedCodeSnippet);
  }

  // expect can close dialog
  await page.click(".btn-close");
  await expect(await page.getByText("DAEDALUS code snippet")).not.toBeVisible();
});
