import { expect, test } from '@playwright/test'

// In this test, we're using toBeInViewport instead of toBeVisible, because when the sidebar is
// off the screen, it's still 'visible' by Playwright's definition, but it's not in the viewport.
// At least, that's the case on mobile devices.
test('Can open and close sidebar by use of the two buttons', async ({ page, baseURL, isMobile }) => {
  await page.goto(`${baseURL}/`)

  const html = await page.innerHTML('body')
  await expect(html).toContain('Home page')

  const sidebarToggleInSidebar = await page.getByTestId('close-sidebar-button')
  // Verify that the sidebar is hidden
  await expect(sidebarToggleInSidebar).not.toBeInViewport()

  const sidebarToggleInHeader = await page.getByTestId('toggle-sidebar-button')

  await sidebarToggleInHeader.click()

  await expect(sidebarToggleInSidebar).toBeInViewport()

  // Close the sidebar
  if (isMobile) {
    // On mobile, the sidebar obscures the control in the header, so we use
    // the control in the sidebar to close it.
    await sidebarToggleInSidebar.click()
  }
  else {
    await sidebarToggleInHeader.click()
  }
  await expect(sidebarToggleInSidebar).not.toBeInViewport()

  // Make sure that we test each button in each type of device:
  await sidebarToggleInHeader.click()

  await expect(sidebarToggleInSidebar).toBeInViewport()

  await sidebarToggleInSidebar.click()
  await expect(sidebarToggleInSidebar).not.toBeInViewport()
})
