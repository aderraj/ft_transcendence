# Environment Configuration Guide

## Quick Setup for Different IPs

To change your server IP, you only need to update **ONE variable** in `.env`:

```bash
HOST_IP=10.14.57.32  # Change this to your server IP
```

All other URLs will be automatically constructed from this value.

## Environment Variables Explained

### `.env` File Configuration

```bash
# Change this to match your server's IP address
HOST_IP=10.14.57.32

# Backend will use HTTPS with self-signed certificates
USE_HTTPS=true
PORT=3001

# OAuth Callbacks - These use nip.io for wildcard SSL
OAUTH_42_CALLBACK_URL=https://10.14.57.32.nip.io:3001/api/auth/42/callback
GOOGLE_CALLBACK_URL=https://10.14.57.32.nip.io:3001/api/auth/google/callback

# CORS Origins - Add your specific origins here
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000,http://localhost:5173,https://10.14.57.32.nip.io:3001
```

## Service URLs

| Service | Internal (Container) | External (Host) | Protocol |
|---------|---------------------|-----------------|----------|
| Backend | 3001 | https://localhost:3001 | HTTPS |
| Frontend | 5173 | http://localhost:3000 | HTTP |
| Game | 3000 | http://localhost:3002 | HTTP |
| Database | 5432 | localhost:5433 | TCP |

## Docker Compose Environment Variables

The `docker-compose.yml` automatically reads from `.env`:

### Backend Service
```yaml
environment:
  - USE_HTTPS=${USE_HTTPS:-true}           # Enables HTTPS
  - HOST_IP=${HOST_IP:-localhost}          # Your server IP
  - OAUTH_42_CALLBACK_URL=${OAUTH_42_CALLBACK_URL}  # From .env
  - GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL}      # From .env
  - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}     # From .env
```

### Frontend Service  
```yaml
environment:
  - VITE_HOST_IP=${HOST_IP:-localhost}     # Used to construct API URL
  - VITE_USE_HTTPS=${USE_HTTPS:-true}      # Tells Vite to use HTTPS
  - VITE_BACKEND_PORT=3001
  - VITE_API_URL=https://${HOST_IP:-localhost}:3001  # Constructed from HOST_IP
```

## CORS Configuration

The backend (`main.ts`) automatically allows:
- `http://localhost:3000` - Local frontend
- `https://localhost:3000` - HTTPS local frontend  
- `http://localhost:3001` - Backend itself
- `https://localhost:3001` - HTTPS backend
- `http://localhost:5173` - Vite dev server
- Any origins from `ALLOWED_ORIGINS` env variable

## OAuth Setup

### 42 OAuth
1. Go to https://profile.intra.42.fr/oauth/applications
2. Set redirect URI to: `https://YOUR_IP.nip.io:3001/api/auth/42/callback`
3. Copy Client ID and Secret to `.env`

### Google OAuth
1. Go to https://console.cloud.google.com/
2. Set authorized redirect URI to: `https://YOUR_IP.nip.io:3001/api/auth/google/callback`
3. Copy Client ID and Secret to `.env`

## SSL Certificates

Self-signed certificates are automatically generated in `./ssl/`:
- `cert.pem` - Certificate
- `key.pem` - Private key

These are mounted to all services that need HTTPS.

## Changing Your IP

When you change your server IP:

1. Update `.env`:
   ```bash
   HOST_IP=NEW_IP_HERE
   ```

2. Update OAuth callback URLs in `.env`:
   ```bash
   OAUTH_42_CALLBACK_URL=https://NEW_IP.nip.io:3001/api/auth/42/callback
   GOOGLE_CALLBACK_URL=https://NEW_IP.nip.io:3001/api/auth/google/callback
   ```

3. Add new IP to CORS if needed:
   ```bash
   ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000,https://NEW_IP.nip.io:3001
   ```

4. Update OAuth providers' redirect URIs

5. Restart services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Testing

### Backend Health
```bash
# HTTPS
curl -k https://localhost:3001/api

# Check from another machine
curl -k https://10.14.57.32:3001/api
```

### Frontend
```bash
# Local
curl http://localhost:3000

# From another machine  
curl http://10.14.57.32:3000
```

### Database
```bash
# From host
psql -h localhost -p 5433 -U transcendence -d transcendence

# From container
docker exec -it transcendence-db psql -U transcendence
```
