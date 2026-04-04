import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api_proxy': {
        target: 'https://api-qbwc-zoho.newwindowsystem.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api_proxy/, '/api_qbwc_zoho'),
      },
      '/ws': {
        target: 'wss://api-qbwc-zoho.newwindowsystem.net/api_qbwc_zoho',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
