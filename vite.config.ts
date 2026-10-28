import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/programma-nutrizionale/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-180.png'],
      manifest: {
        name: 'Programma Nutrizionale',
        short_name: 'Programma',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F2F2F7',
        theme_color: '#F2F2F7',
        icons: [
          { src: 'icon-180.png', sizes: '180x180', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'], cleanupOutdatedCaches: true },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
});
