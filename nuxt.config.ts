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
    },
  },

  modules: [
    "@nuxtjs/fontaine", // https://nuxt.com/docs/getting-started/styling#font-advanced-optimization
    "@pinia/nuxt",
    "@nuxt/test-utils/module", // https://nuxt.com/docs/getting-started/testing#setup
    "@nuxt/eslint",
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
});
