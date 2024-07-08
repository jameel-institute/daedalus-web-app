import { test, expect } from '@playwright/test'

test('testing foo', async ({ page, baseURL }) => {
  await page.goto(baseURL + '/')

  const html = await page.innerHTML('body')
  expect(html).toContain('Home page')

  const transportText = await page.locator('text=Transport')
  
  const time = Date.now()
  
  // await page.screenshot({ path: `${time}-screenshot.png`, fullPage: true });

  await expect(transportText).toBeVisible()
})
