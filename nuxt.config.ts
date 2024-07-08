// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  debug: true,
  features: { devLogs: true },

  nitro: {
     experimental: {
       websocket: true
     },
  },

  modules: [
    "@nuxtjs/fontaine", // https://nuxt.com/docs/getting-started/styling#font-advanced-optimization
  ]
})