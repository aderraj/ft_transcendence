# 🎮 Transcendence - Production Setup Guide

A production-ready multiplayer Pong game with NestJS backend and React frontend.

## 🚀 Quick Start (One Command Setup)

```bash
# Clone and start everything
git clone <repository-url>
cd get_ready
make build
```

That's it! The application will:
- ✅ Build all containers
- ✅ Start PostgreSQL database
- ✅ Run database migrations automatically
- ✅ Seed initial data
- ✅ Start backend API with HTTPS
- ✅ Start frontend with HTTPS

## 📋 Prerequisites

- Docker & Docker Compose
- Make (optional, for convenience commands)
- SSL certificates (self-signed provided, replace for production)

## 🔧 Configuration

### 1. Environment Variables

Copy the example and configure:
```bash
cp .env.example .env
```

**Required Variables:**
```bash
# OAuth (Get from https://profile.intra.42.fr/oauth/applications)
OAUTH_42_CLIENT_ID=your_client_id
OAUTH_42_CLIENT_SECRET=your_client_secret
OAUTH_42_CALLBACK_URL=https://your-domain.com:3001/api/auth/42/callback

# Email (for password reset)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@transcendence.com

# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# HTTPS (set to false for HTTP)
USE_HTTPS=true
```

### 2. SSL Certificates

**Development (Already provided):**
Self-signed certificates are in `./ssl/` directory.

**Production:**
Replace with proper certificates:
```bash
# Using Let's Encrypt
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/server.key
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/server.crt
```

## 📦 Available Commands

```bash
make help          # Show all available commands
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make build         # Rebuild from scratch
make clean         # Remove everything (including data)
make logs          # View all logs
make logs-back     # View backend logs only
make logs-front    # View frontend logs only
make health        # Check service health status
make shell-back    # Open backend shell
make shell-db      # Open PostgreSQL shell
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │ │
│  │  React+Vite  │◄─┤   NestJS     │◄─┤   Database   │ │
│  │  Port: 3000  │  │  Port: 3001  │  │  Port: 5432  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ▲                  ▲                            │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
     HTTPS (3000)       HTTPS (3001)
```

## 🔒 Security Features

- ✅ HTTPS support (configurable)
- ✅ JWT authentication
- ✅ OAuth 2.0 (42 Intra)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention (Prisma ORM)

## 🗄️ Database

### Automatic Setup
The backend container automatically:
1. Waits for PostgreSQL to be ready
2. Runs migrations
3. Generates Prisma Client
4. Seeds initial data (in development)

### Manual Operations
```bash
# Access database
make shell-db

# Run migrations manually
docker exec transcendence-backend npx prisma migrate deploy

# View database in Prisma Studio
docker exec transcendence-backend npx prisma studio
# Then open http://localhost:5555
```

## 🩺 Health Checks

All services have built-in health checks:

```bash
# Check all services
make health

# Or use docker directly
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Health endpoints:
- Backend: `http://localhost:3001/api`
- Frontend: `http://localhost:3000`
- Database: `pg_isready` command

## 📊 Monitoring & Logs

```bash
# Live logs from all services
make logs

# Specific service logs
make logs-back    # Backend
make logs-front   # Frontend  
make logs-db      # Database

# Follow logs with filtering
docker-compose logs -f backend | grep ERROR
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
make logs

# Rebuild from scratch
make build

# Check health status
make health
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker exec transcendence-db pg_isready -U transcendence

# Check migrations
docker exec transcendence-backend npx prisma migrate status
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process or change ports in docker-compose.yml
```

### SSL Certificate errors
```bash
# Regenerate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key -out ssl/server.crt \
  -subj "/CN=localhost"

# Or disable HTTPS in .env
USE_HTTPS=false
```

## 🚢 Production Deployment

### Docker Compose (Recommended)
```bash
# Set environment to production
NODE_ENV=production make build

# Or use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Steps
1. Update `.env` with production values
2. Replace SSL certificates with valid ones
3. Set strong `JWT_SECRET`
4. Configure proper SMTP settings
5. Update OAuth callback URL in 42 settings
6. Build and deploy:
```bash
NODE_ENV=production make build
```

## 📝 API Documentation

Once running, access Swagger documentation at:
```
https://your-domain:3001/api
```

## 🧪 Testing

```bash
# Run backend tests
make test

# Run tests in watch mode
docker exec transcendence-backend npm run test:watch

# Run e2e tests
docker exec transcendence-backend npm run test:e2e
```

## 🔄 Updates & Maintenance

```bash
# Update dependencies
docker exec transcendence-backend npm update
docker exec transcendence-frontend npm update

# Rebuild after updates
make build

# Backup database
docker exec transcendence-db pg_dump -U transcendence transcendence > backup.sql

# Restore database
cat backup.sql | docker exec -i transcendence-db psql -U transcendence
```

## 📚 Tech Stack

**Backend:**
- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL
- Socket.IO (WebSockets)
- JWT & OAuth 2.0
- Swagger/OpenAPI

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- Axios
- Socket.IO Client

**Infrastructure:**
- Docker & Docker Compose
- Nginx (optional reverse proxy)
- Let's Encrypt (production SSL)

## 📄 License

[Your License Here]

## 🤝 Contributing

[Contribution Guidelines]

## 📞 Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: [link]
- Email: [email]
