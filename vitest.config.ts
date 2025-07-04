import { defineVitestConfig } from "@nuxt/test-utils/config";
import { coverageConfigDefaults } from "vitest/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    // you can optionally set Nuxt-specific environment options
    environmentOptions: {
      nuxt: {
        domEnvironment: "jsdom",
        overrides: {
          // other Nuxt config you want to pass
          runtimeConfig: {
            public: {
              feature: {
                comparison: true,
              },
            },
          },
        },
      },
    },
    coverage: {
      exclude: ["**/*.config.ts", "modules/coreui.ts", ...coverageConfigDefaults.exclude],
    },
    hookTimeout: 30000,
    restoreMocks: true,
    globals: true,
  },
});
