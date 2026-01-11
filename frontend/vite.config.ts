import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync('/app/ssl/key.pem'),
      cert: fs.readFileSync('/app/ssl/cert.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://backend:3001',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      },
    },
  },
})
