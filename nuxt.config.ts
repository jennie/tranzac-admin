export default defineNuxtConfig({
  extends: ["@nuxt/ui-pro"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "nuxt-mongoose",
    "./modules/auth.module",
  ],
  runtimeConfig: {
    public: {
      datoCmsToken: process.env.DATO_API_TOKEN,
    },
  },
  ui: {
    icons: ["ph", "logos", "simple-icons", "heroicons"],
    safelistColors: ["primary", "red", "orange", "green"],
  },
  colorMode: {
    disableTransition: true,
  },
  devtools: {
    enabled: true,
  },
  typescript: {
    strict: false,
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
