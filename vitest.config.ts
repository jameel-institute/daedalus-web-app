import { defineVitestConfig } from "@nuxt/test-utils/config";
import { coverageConfigDefaults } from "vitest/config";

export default defineVitestConfig({
  test: {
    setupFiles: ["/tests/vitestSetup.ts"],
    // you can optionally set Nuxt-specific environment options
    environmentOptions: {
      nuxt: {
        domEnvironment: "jsdom",
        overrides: {
          // other Nuxt config you want to pass
        },
      },
    },
    coverage: {
      exclude: ["**/*.config.ts", ...coverageConfigDefaults.exclude],
    },
  },
});
