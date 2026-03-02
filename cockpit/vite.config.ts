import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
