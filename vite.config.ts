import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Приложение живёт в подпапке GitHub Pages (/dar-recipes/), поэтому все пути относительные
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      includeAssets: ['favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Рецепты',
        short_name: 'Рецепты',
        description: 'Рецепты, пересчёт порций и список покупок. Работает без интернета.',
        lang: 'ru',
        // Относительные адреса: манифест лежит в /dar-recipes/, и приложение не выходит за эту подпапку
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f5f2',
        theme_color: '#047857',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        // Hash-роутинг: любые навигации обслуживает index.html
        navigateFallback: 'index.html',
      },
    }),
  ],
})
