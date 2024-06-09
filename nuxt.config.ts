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
  ui: {
    icons: ["heroicons", "simple-icons"],
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
