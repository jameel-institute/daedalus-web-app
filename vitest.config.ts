import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // you can optionally set Nuxt-specific environment options
    environmentOptions: {
      nuxt: {
        domEnvironment: 'jsdom',
        overrides: {
          // other Nuxt config you want to pass
        }
      }
    }
  }
});