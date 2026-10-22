import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import webhookHandler from './api/webhook.js'
import tokenHandler from './api/token.js'

// Yerelde /api/* isteklerini Vercel fonksiyonlarıyla aynı handler'lara yönlendirir.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api/webhook', (req, res) => webhookHandler(req, res))
      server.middlewares.use('/api/token', (req, res) => tokenHandler(req, res))
    },
  }
}

// GitHub Pages: site https://serkanakpolat.github.io/atolyekart/ altında yayınlanır.
// Vercel kök dizinden sunar (build sırasında VERCEL=1 tanımlıdır).
export default defineConfig(({ command }) => ({
  base: command === 'build' && !process.env.VERCEL ? '/atolyekart/' : '/',
  plugins: [react(), localApi()],
}))
