import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: site https://serkanakpolat.github.io/atolyekart/ altında yayınlanır.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/atolyekart/' : '/',
  plugins: [react()],
}))
