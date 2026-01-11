# 🌐 Host IP Configuration

## Overview
The application now uses a centralized `HOST_IP` environment variable, making it easy to change the server's IP address in one place.

## What Changed

### 1. Environment Variables (.env)
```bash
# New variable - Change this to your server's IP
HOST_IP=10.14.57.32

# These now use ${HOST_IP} variable
FRONTEND_URL=https://${HOST_IP}:3000
OAUTH_42_CALLBACK_URL=https://${HOST_IP}:3001/api/auth/42/callback
```

### 2. Frontend Configuration
- **New file**: `frontend/src/config.ts` - Centralized configuration
- **New file**: `frontend/src/vite-env.d.ts` - TypeScript definitions for Vite env vars
- **Updated**: `frontend/src/api.ts` - Uses `config.API_URL`
- **Updated**: `frontend/src/Chat.tsx` - Uses `config.API_URL`
- **Updated**: `frontend/src/App.tsx` - Uses `config.API_URL` for OAuth

### 3. Docker Configuration
```yaml
backend:
  environment:
    HOST_IP: ${HOST_IP:-localhost}

frontend:
  environment:
    VITE_HOST_IP: ${HOST_IP:-localhost}
    VITE_USE_HTTPS: ${USE_HTTPS:-false}
    VITE_BACKEND_PORT: ${PORT:-3001}
```

## How to Change IP Address

### Option 1: Quick Change (Recommended)
Just update `.env` file:
```bash
# Change this line
HOST_IP=10.14.57.32  # Change to your new IP

# Then restart containers
docker-compose restart
```

### Option 2: Complete Rebuild
```bash
# Update .env
HOST_IP=your-new-ip

# Rebuild and restart everything
docker-compose down
docker-compose up -d --build
```

## What Gets Updated Automatically

When you change `HOST_IP`, these URLs update automatically:
- ✅ Frontend API calls
- ✅ WebSocket connections (Chat)
- ✅ OAuth redirect URI
- ✅ CORS configuration
- ✅ OAuth callback endpoint

## Environment Variables Reference

### Backend
- `HOST_IP` - Server IP address
- `USE_HTTPS` - Enable HTTPS (true/false)
- `PORT` - Backend port (default: 3001)
- `FRONTEND_URL` - Constructed from HOST_IP
- `OAUTH_42_CALLBACK_URL` - Constructed from HOST_IP

### Frontend (Vite)
- `VITE_HOST_IP` - Server IP address
- `VITE_USE_HTTPS` - Enable HTTPS (true/false)
- `VITE_BACKEND_PORT` - Backend port (default: 3001)

## Configuration File (frontend/src/config.ts)

```typescript
const HOST_IP = import.meta.env.VITE_HOST_IP || 'localhost';
const USE_HTTPS = import.meta.env.VITE_USE_HTTPS === 'true';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3001';

const PROTOCOL = USE_HTTPS ? 'https' : 'http';

export const config = {
  HOST_IP,
  USE_HTTPS,
  BACKEND_PORT,
  PROTOCOL,
  BACKEND_URL: `${PROTOCOL}://${HOST_IP}:${BACKEND_PORT}`,
  API_URL: `${PROTOCOL}://${HOST_IP}:${BACKEND_PORT}`,
};
```

## Testing

After changing the IP:

1. **Verify environment loading**:
```bash
docker exec transcendence-backend env | grep HOST_IP
docker exec transcendence-frontend env | grep VITE_HOST_IP
```

2. **Test frontend**:
- Open browser: `https://your-new-ip:3000`
- Check console for API URL
- Try OAuth login

3. **Test backend**:
```bash
curl -k https://your-new-ip:3001/api
```

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_HOST_IP` in frontend container
- Verify browser can access backend URL
- Check browser console for errors

### OAuth redirect fails
- Update 42 OAuth app settings with new callback URL
- URL format: `https://YOUR_IP:3001/api/auth/42/callback`
- Restart backend after updating .env

### WebSocket connection fails
- Check `config.API_URL` in browser console
- Verify WSS/WS protocol matches HTTPS/HTTP setting
- Check firewall allows WebSocket connections

## Production Deployment

For production:
1. Set `HOST_IP` to your domain or production IP
2. Set `USE_HTTPS=true`
3. Replace self-signed SSL certificates with proper ones
4. Change `JWT_SECRET` to a strong random value
5. Configure proper SMTP credentials
6. Update 42 OAuth app with production callback URL

## Examples

### Local Development
```bash
HOST_IP=localhost
USE_HTTPS=false
```

### School Computer
```bash
HOST_IP=10.14.57.32
USE_HTTPS=true
```

### Production Server
```bash
HOST_IP=transcendence.yourdomain.com
USE_HTTPS=true
JWT_SECRET=very-long-random-production-secret-key
NODE_ENV=production
```
