import { expect, test } from "@playwright/test";
import checkRApiServer from "./helpers/checkRApiServer";

test.beforeAll(async () => {
  checkRApiServer();
});

test("Can request a scenario analysis run", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForURL(`${baseURL}/scenarios/new`);

  await expect(page.getByTestId("sidebar")).toBeInViewport(); // Litmus test for the page having fully loaded
  await expect(page.getByText("Simulate a new scenario")).toBeVisible();

  await page.selectOption('select[id="pathogen"]', { label: "Influenza 1957" });
  await page.selectOption('select[id="response"]', { label: "Elimination" });
  await page.selectOption('select[id="country"]', { label: "United States" });
  await page.click('div[aria-label="Advance vaccine investment"] label[for="low"]');

  const form = await page.waitForSelector("form");
  const formData = await form.getAttribute("data-test-form-data");
  const parsedFormData = JSON.parse(formData!);
  await expect(parsedFormData).toEqual({
    pathogen: "influenza-1957",
    response: "elimination",
    country: "United States",
    vaccine: "low",
  });

  await page.click('button:has-text("Run")');

  const dummyRunIdHash = "007e5f5453d64850";
  await page.waitForURL(`${baseURL}/scenarios/${dummyRunIdHash}`);
  await expect(page.url()).toBe(`${baseURL}/scenarios/${dummyRunIdHash}`);

  // TODO: Continue writing test
  // await expect(page.getByText("Simulate a new scenario")).not.toBeVisible();
});
