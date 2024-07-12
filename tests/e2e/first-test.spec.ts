import { expect, test } from '@playwright/test'

test('testing foo', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`)

  const html = await page.innerHTML('body')
  expect(html).toContain('Home page')
})
