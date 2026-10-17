import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: site https://serkanakpolat.github.io/atolyekart/ altında yayınlanır.
// Vercel kök dizinden sunar (build sırasında VERCEL=1 tanımlıdır).
export default defineConfig(({ command }) => ({
  base: command === 'build' && !process.env.VERCEL ? '/atolyekart/' : '/',
  plugins: [react()],
}))
