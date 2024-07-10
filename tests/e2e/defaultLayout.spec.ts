import { test, expect } from '@playwright/test'

test('Can open and close sidebar by use of the two buttons', async ({ page, baseURL }) => {
  await page.goto(baseURL + '/')
  
  const html = await page.innerHTML('body')
  await expect(html).toContain('Home page')
    
  const sidebarToggleInSidebar = await page.getByTestId('close-sidebar-button')
  await expect(sidebarToggleInSidebar).not.toBeVisible()
  
  const sidebarToggleInHeader = await page.getByTestId('toggle-sidebar-button')
    
  await sidebarToggleInHeader.click()

  await expect(sidebarToggleInSidebar).toBeVisible()

  await sidebarToggleInHeader.click()
  await expect(sidebarToggleInSidebar).not.toBeVisible()

  await sidebarToggleInHeader.click()
  await expect(sidebarToggleInSidebar).toBeVisible()

  await sidebarToggleInSidebar.click()
  await expect(sidebarToggleInSidebar).not.toBeVisible()
})