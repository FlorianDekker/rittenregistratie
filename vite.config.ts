/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serveert de app op een subpad: /rittenregistratie/.
// In dev houden we het op de root (/), in productie op het subpad.
const PROD_BASE = '/rittenregistratie/'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? PROD_BASE : '/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'Rittenregistratie',
          short_name: 'Ritten',
          description: 'Bijhouden van zakelijke en privé-ritten voor de auto van de zaak.',
          lang: 'nl',
          theme_color: '#eef2f0',
          background_color: '#eef2f0',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
