import process from "node:process";

const cacheRoute = (maxAge: number) => {
  // Don't cache endpoints during integration tests, so that tests are isolated.
  // In end-to-end tests, this variable evaluates to "production" so long as Playwright is using
  // a built version of the app rather than `npm run dev`.
  return process.env.NODE_ENV === "test" ? {} : { cache: { maxAge } };
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ["tslib"], // https://github.com/nuxt/nuxt/discussions/21533
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  debug: false,
  features: { devLogs: true },

  nitro: {
    experimental: {
      websocket: true,
    },
    routeRules: {
      "/": { redirect: "/scenarios/new" },
      "/api/versions": cacheRoute(60),
      "/api/metadata": cacheRoute(60),
      "/api/scenarios/*/result": cacheRoute(60),
    },
  },

  modules: [
    "@nuxtjs/fontaine", // https://nuxt.com/docs/getting-started/styling#font-advanced-optimization
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt", // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt.html
    "@nuxt/test-utils/module", // https://nuxt.com/docs/getting-started/testing#setup
    "@nuxt/eslint",
    "@vueuse/nuxt",
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern",
          additionalData: '@use "~/assets/scss/_variables.scss" as *;', // Enables variables to be accessible in SFC styles. https://nuxt.com/docs/getting-started/styling#using-preprocessors
          quietDeps: true,
        },
      },
    },
    resolve: {
      dedupe: ["vue-router"], // https://github.com/nuxt/nuxt/issues/15434#issuecomment-1408651163
    },
  },

  eslint: {
    config: {
      standalone: false, // https://github.com/antfu/eslint-config/issues/506#issuecomment-2173283141
    },
  },

  runtimeConfig: {
    rApiBase: "", // Overriden by environment variable NUXT_R_API_BASE
  },

  $test: {
    runtimeConfig: {
      rApiBase: "", // https://nuxt.com/docs/getting-started/testing#registerendpoint
    },
  },

  compatibilityDate: "2025-04-01",
});
