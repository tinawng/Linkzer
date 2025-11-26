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
    SPOTIFY_USER_CLIENT: "",
    SPOTIFY_USER_SECRET: ""
  },

  routeRules: {
    "/": { prerender: true },
  },

  modules: ["@nuxtjs/tailwindcss"],

  css: ["@/assets/css/base.postcss"],
  tailwindcss: { viewer: false },
})
