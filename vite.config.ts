/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Install and offline: a web app manifest plus a service worker that
    // precaches every built file, so after the first visit the app runs with
    // no network. Anything added under src/ or public/ is picked up by the
    // glob below; new file types need adding to globPatterns.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeManifestIcons: false, // already covered by globPatterns
      manifest: {
        name: "Olivia's Egg Garden",
        short_name: 'Egg Garden',
        description: 'A sticker-chart garden where gold stars hatch eggs.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#cdeeff',
        theme_color: '#cdeeff',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
