// Configuration from environment variables
const HOST_IP = import.meta.env.VITE_HOST_IP || 'localhost';
const USE_HTTPS = import.meta.env.VITE_USE_HTTPS !== 'false'; // Default to true
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '443';

const PROTOCOL = USE_HTTPS ? 'https' : 'http';

// When going through WAF (port 443/80), don't append port
const needsPort = BACKEND_PORT !== '443' && BACKEND_PORT !== '80';
const portSuffix = needsPort ? `:${BACKEND_PORT}` : '';

export const config = {
  HOST_IP,
  USE_HTTPS,
  BACKEND_PORT,
  PROTOCOL,
  // API URL - when using WAF, goes through same origin
  API_URL: import.meta.env.VITE_API_URL || `${PROTOCOL}://${HOST_IP}${portSuffix}`,
  // WebSocket URL for Socket.IO
  WS_URL: `${USE_HTTPS ? 'wss' : 'ws'}://${HOST_IP}${portSuffix}`,
};

// Debug logging
console.log('🔧 Frontend Configuration:', {
  HOST_IP,
  USE_HTTPS,
  BACKEND_PORT,
  PROTOCOL,
  API_URL: config.API_URL,
  WS_URL: config.WS_URL,
  env: import.meta.env,
});

export default config;
