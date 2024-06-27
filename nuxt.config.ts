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
    // preset: 'node-cluster', // - I think this is known not to work with websockets
  },
})