// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
       websocket: true
     },
  },

  modules: [
    "@nuxtjs/fontaine", // https://nuxt.com/docs/getting-started/styling#font-advanced-optimization
    "@pinia/nuxt",
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *;' // Enables variables to be accessible in SFC styles. https://nuxt.com/docs/getting-started/styling#using-preprocessors
        }
      }
    }
  }
  
})