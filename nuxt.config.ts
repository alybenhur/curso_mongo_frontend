// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Nuxt 4 usa app/ como srcDir por defecto;
  // este proyecto usa la estructura clásica (raíz).
  srcDir: '.',
  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
    plugins: 'plugins',
    assets: 'assets',
    public: 'public',
  },


  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001/api',
    },
  },

  app: {
    head: {
      title: 'MongoTutor',
      meta: [
        { name: 'description', content: 'Plataforma de aprendizaje de MongoDB y bases de datos NoSQL' },
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },


})
