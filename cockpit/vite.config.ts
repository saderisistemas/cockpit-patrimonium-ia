import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'IRIS Cockpit - Patrimonium',
        short_name: 'IRIS Cockpit',
        description: 'Centro de Monitoramento Tático de Eventos Real-Time',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy direto: /webhook/* → https://patrimonium-n8n.cloudfy.live/webhook/*
      // SEM rewrite — mesmo path nos dois lados. Simples e confiável.
      // Em produção o Netlify faz o mesmo via netlify.toml redirect.
      '/webhook': {
        target: 'https://patrimonium-n8n.cloudfy.live',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
