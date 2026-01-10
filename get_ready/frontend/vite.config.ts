import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist
const sslKeyPath = '/app/ssl/key.pem'
const sslCertPath = '/app/ssl/cert.pem'
const hasSSL = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // When behind WAF, don't use HTTPS (WAF handles SSL termination)
    // Only use HTTPS for direct access
    ...(hasSSL && process.env.VITE_USE_HTTPS === 'true' ? {
      https: {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
    } : {}),
    // HMR through WAF proxy
    hmr: {
      // Use WebSocket through the WAF
      clientPort: 443,
      protocol: 'wss',
    },
  },
})
