export default defineNuxtConfig({
  ssr: false,

  nitro: {
    preset: "bun",
    experimental: { noVueServer: true },
  },

  app: {
    head: {
      title: "Linkzer",
    },
  },

  runtimeConfig: {
    SPOTIFY_CLIENT_ID: "",
    SPOTIFY_CLIENT_SECRET: "",
    TIDAL_CLIENT_ID: "",
    TIDAL_CLIENT_SECRET: "",
  },

  routeRules: {
    "/": { prerender: true },
  },

  modules: ["@nuxtjs/tailwindcss"],

  css: ["@/assets/css/base.postcss"],
  tailwindcss: { viewer: false },
})
