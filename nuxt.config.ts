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
  app: {
    server: {
      port: 3001, // Replace with your desired port
    },
  },
  runtimeConfig: {
    public: {
      datoCmsToken: process.env.DATO_API_TOKEN,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
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
