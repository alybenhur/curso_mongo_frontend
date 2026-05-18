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

  // CSS global — cargado en <head> tanto en SSR como en cliente
  css: ['~/assets/css/main.css'],

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // apiBase se puede sobreescribir con la variable de entorno NUXT_PUBLIC_API_BASE
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
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
      link: [
        // Fuentes de Google para mejor tipografía
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  // Necesario para que el build de producción incluya bien el CSS
  vite: {
    css: {
      devSourcemap: true,
    },
  },
})
