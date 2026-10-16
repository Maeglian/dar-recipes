import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Приложение живёт в подпапке GitHub Pages (/dar-recipes/), поэтому все пути относительные
  base: './',
  plugins: [vue()],
})
