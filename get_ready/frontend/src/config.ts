// Configuration from environment variables
const HOST_IP = import.meta.env.VITE_HOST_IP || 'localhost';
const USE_HTTPS = import.meta.env.VITE_USE_HTTPS === 'true';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3001';
const FRONTEND_PORT = '3000';

const PROTOCOL = USE_HTTPS ? 'https' : 'http';

export const config = {
  HOST_IP,
  USE_HTTPS,
  BACKEND_PORT,
  FRONTEND_PORT,
  PROTOCOL,
  BACKEND_URL: `${PROTOCOL}://${HOST_IP}:${BACKEND_PORT}`,
  FRONTEND_URL: `${PROTOCOL}://${HOST_IP}:${FRONTEND_PORT}`,
  API_URL: `${PROTOCOL}://${HOST_IP}:${BACKEND_PORT}`,
};

// Debug logging
console.log('🔧 Frontend Configuration:', {
  HOST_IP,
  USE_HTTPS,
  BACKEND_PORT,
  PROTOCOL,
  API_URL: config.API_URL,
  env: import.meta.env,
});

export default config;
