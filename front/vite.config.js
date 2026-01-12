import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias : {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://localhost',
        changeOrigin: true,
        secure: false
      },
      '/game': {
        target: process.env.VITE_API_URL || 'https://localhost',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'https://localhost',
        changeOrigin: true,
        secure: false,
        ws: true
      },
    },
  },
})
