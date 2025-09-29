export default async (page, baseURL, isMobile) => {
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  if (isMobile) { // For unknown reasons, in this test, mobile browsers require an extra click to start the comparison
    await page.getByRole("button", { name: "Compare", exact: true }).click();
  }

  await page.waitForURL(new RegExp(`${baseURL}/comparison\?.*`));
};
