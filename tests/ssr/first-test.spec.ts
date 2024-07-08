import { expect, describe, test } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'


describe('My test', async () => {
  await setup({
    runner: 'vitest' // this is the default value but I'm just making it explicit
  })

  test('server-rendered content', async () => {
    const html = await $fetch('/')

    // screen.debug()
    expect(html).toContain('DAEDALUS Explore')
  })
})
