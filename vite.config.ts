import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site at /oneplus-compare/; CI sets BASE_PATH
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // The bundle includes the full spec sheet for every phone (~230 KB gzipped)
  build: { chunkSizeWarningLimit: 1600 },
})
