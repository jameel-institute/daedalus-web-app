// Optimistic description:
// The tests under e2e, which are run by playwright, are for testing the full-stack
// (client app and server app) in a browser environment.
// Since the server-rendered page may be different from the client-rendered page,
// for example, when some elements are configured to only render on the client side,
// relevant tests should wait for the elements to be present.

import { test, expect } from '@playwright/test'

test('testing foo', async ({ page, baseURL }) => {
  await page.goto(baseURL + '/')

  const html = await page.innerHTML('body')
  expect(html).toContain('Home page')

  const transportText = await page.locator('text=Transport')
  
  console.log(transportText)

  const time = Date.now()
  
  // await page.screenshot({ path: `${time}-screenshot.png`, fullPage: true });


  // HERE BE DRAGONS!!!!!!!!!!
  // YOU HAVE TO AWAIT EXPECTS IN PLAYWRIGHT
  // The clue for this was playwright designating some tests as 'flaky',
  // whereas if this had correctly been retrying, it wouldn't have complained.
  await expect(transportText).toBeVisible()
})

// Question - does this incorporate client-only components?