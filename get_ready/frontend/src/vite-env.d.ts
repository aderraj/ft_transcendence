/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST_IP: string
  readonly VITE_USE_HTTPS: string
  readonly VITE_BACKEND_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
