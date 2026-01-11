# Transcendence - Deployment Guide

## 🚀 Quick Start on Fresh Machine

### Prerequisites
- Docker & Docker Compose installed
- Git installed

### One-Command Setup
```bash
git clone https://github.com/aderraj/ft_transcendence.git
cd ft_transcendence
cp .env.example .env  # Edit with your values
docker-compose up -d
```

That's it! The setup will automatically:
1. Generate SSL certificates if they don't exist
2. Run all Prisma migrations
3. Seed the database with test users
4. Start all services (PostgreSQL, Backend, Frontend)

---

## 📋 Environment Configuration

### Required Variables (.env file)

```bash
# Your machine's IP address (change this for each machine)
HOST_IP=10.14.57.32

# Database Configuration
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=transcendence
POSTGRES_DB=transcendence

# JWT Secret (generate a random one for production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 42 OAuth (get from https://profile.intra.42.fr/oauth/applications/new)
OAUTH_42_CLIENT_ID=your_42_client_id
OAUTH_42_CLIENT_SECRET=your_42_client_secret

# Google OAuth (optional - leave as 'disabled' if not using)
GOOGLE_CLIENT_ID=disabled
GOOGLE_CLIENT_SECRET=disabled

# Application Settings
NODE_ENV=development
PORT=3001
USE_HTTPS=true
```

---

## 🔐 SSL Certificates

SSL certificates are **automatically generated** when you run `docker-compose up` for the first time.

The `ssl-init` service creates self-signed certificates if they don't exist:
- `ssl/cert.pem` - SSL certificate
- `ssl/key.pem` - SSL private key

The certificates are valid for 365 days and use your `HOST_IP` as the Common Name.

### Manual SSL Generation (if needed)
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Transcendence/CN=YOUR_IP_HERE"
```

---

## 🗄️ Database Migrations

Migrations run **automatically** on container startup via the `docker-entrypoint.sh` script.

### What Happens:
1. Backend waits for PostgreSQL to be ready
2. Runs `prisma migrate deploy` to apply all pending migrations
3. Generates Prisma Client
4. Seeds database with test users (development only)

### Current Migrations:
- `20251213180317_init` - Initial schema
- `20251213182337_add_password` - Password field
- `20260107195955_add_intra_id_and_messages` - 42 OAuth + Chat
- `20260107223242_add_password_reset` - Password reset tokens
- `20260108220800_add_google_oauth` - Google OAuth support

### Manual Migration Commands:
```bash
# View migration status
docker exec transcendence-backend npx prisma migrate status

# Reset database (⚠️ DESTROYS ALL DATA)
docker exec transcendence-backend npx prisma migrate reset

# Create new migration (must be done locally, not in Docker)
npx prisma migrate dev --name migration_name
```

---

## 🐛 Troubleshooting

### Backend Won't Start - "Table does not exist"
**Fixed!** Migrations now run automatically. If you still see this:
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Fresh start
```

### Backend Crashes - "OAuth2Strategy requires a clientID"
**Fixed!** Google OAuth is now optional. Set to `disabled` in .env if not using.

### HTTPS Not Working
**Fixed!** SSL certificates auto-generate. Check:
```bash
ls -la ssl/  # Should show cert.pem and key.pem
```

### Frontend Can't Connect to Backend
**Fixed!** Proper SSL certificate paths in `main.ts`. Verify:
```bash
curl -k https://YOUR_IP:3001/api  # Should return Swagger UI
```

### Migration Fails - "P3005: database schema is not empty"
**Fixed!** The entrypoint script handles this automatically with `db push` fallback.

---

## 🔧 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (fresh database)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Access PostgreSQL
docker exec -it transcendence-db psql -U transcendence -d transcendence
```

---

## 📦 Services

### PostgreSQL (transcendence-db)
- Port: 5433 (host) → 5432 (container)
- Database: `transcendence`
- User: `transcendence`
- Password: `transcendence`

### Backend (transcendence-backend)
- Port: 3001
- Framework: NestJS
- API Docs: https://YOUR_IP:3001/api
- Health Check: Waits for PostgreSQL

### Frontend (transcendence-frontend)
- Port: 3000 (host) → 5173 (container)
- Framework: React + Vite
- Dev Server: https://YOUR_IP:3000
- Health Check: Waits for Backend

### SSL Init (transcendence-ssl-init)
- Runs once at startup
- Generates SSL certificates if missing
- Exits after completion

---

## 🧪 Test Users

After seeding, you can log in with:

| Username | Password  | ELO  |
|----------|-----------|------|
| reda     | password1 | 1200 |
| samir    | password2 | 1100 |
| aymen    | password3 | 1050 |
| karim    | password4 | 1000 |
| user5    | password5 | 950  |

---

## 🔑 OAuth Setup

### 42 OAuth
1. Go to https://profile.intra.42.fr/oauth/applications/new
2. Set redirect URI: `https://YOUR_IP:3001/api/auth/42/callback`
3. Copy Client ID and Secret to `.env`

### Google OAuth (Optional)
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://YOUR_IP:3001/api/auth/google/callback`
4. Copy Client ID and Secret to `.env`
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (not 'disabled')

---

## 📝 Files Modified for Fresh Machine Support

### ✅ Fixed Issues:
1. **SSL Auto-Generation** - Added `ssl-init` service in docker-compose.yml
2. **Database Migrations** - Updated `docker-entrypoint.sh` to run migrations automatically
3. **Google OAuth Optional** - Made Google OAuth work with dummy credentials
4. **SSL Certificate Paths** - Fixed typos in `backend/src/main.ts` (key.pem, cert.pem)
5. **HOST_IP Centralization** - All configs use `${HOST_IP}` variable

### Key Files:
- `docker-compose.yml` - Added ssl-init service, proper dependencies
- `backend/docker-entrypoint.sh` - Improved migration handling
- `backend/src/main.ts` - Fixed SSL certificate paths
- `backend/src/auth/strategies/google.strategy.ts` - Fallback to dummy credentials
- `.env` - Added HOST_IP variable, proper defaults

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update `POSTGRES_PASSWORD` to a secure password
- [ ] Set up real OAuth credentials (42 and/or Google)
- [ ] Review and update `HOST_IP` for your server
- [ ] Set `NODE_ENV=production`
- [ ] Use proper SSL certificates (not self-signed)
- [ ] Set up proper backup strategy for PostgreSQL volume
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Review security settings in docker-compose.yml

---

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify services: `docker-compose ps`
- Check environment: `docker exec transcendence-backend env`

---

**Last Updated:** January 8, 2026
**Version:** 1.0.0
