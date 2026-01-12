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
  // server: {
  //   host: '0.0.0.0',
  //   allowedHosts: [
  //     '10.14.57.32.nip.io',
  //     'localhost',
  //     '10.14.57.32'
  //   ],
  //   proxy: {
  //     '/api': {
  //       target: 'https://10.14.57.32.nip.io:3001',
  //       changeOrigin: true,
  //       secure: false
  //     },
  //   },
  // },
})
