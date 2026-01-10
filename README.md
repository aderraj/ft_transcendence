# ft_transcendence

*This project has been created as part of the 42 curriculum.*

## Description

ft_transcendence - A full-stack Pong web application with enterprise-grade infrastructure.

### Features
- **Pong Game**: Real-time multiplayer pong game with matchmaking
- **User System**: Authentication, profiles, friends, chat
- **OAuth**: 42 and Google OAuth integration
- **2FA**: Two-factor authentication support

### Infrastructure (Cybersecurity & DevOps)
- **WAF (Web Application Firewall)**: Nginx + ModSecurity with OWASP Core Rule Set
- **Secrets Management**: HashiCorp Vault for secure credential storage
- **Monitoring**: Prometheus + Grafana dashboards
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **SSL/TLS**: Automatic certificate generation

## Architecture

```
[Internet] → [WAF/Nginx:443] → [Frontend:5173]
                    ↓
              [Backend:3001] ← [Vault:8200]
                    ↓
              [PostgreSQL:5432]
                    
            ═══════════════════════
            secure_net (isolated network)
            ═══════════════════════
                    ↓
         [ELK Stack] [Prometheus/Grafana]
```

## Quick Start

```bash
# Clone and enter directory
cd ft_transcendence

# Copy environment file
cp .env.example .env
# Edit .env with your OAuth credentials (optional)

# Start everything
make

# Or start core services only (faster for development)
make dev
```

### Access Points
- **Application**: https://localhost
- **Vault UI**: https://localhost:8200/ui
- **Kibana**: https://localhost:5601
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

### Get Vault Credentials
```bash
make vault-token
```

## Development Commands

```bash
# View all commands
make help

# Database operations
make db-studio      # Open Prisma Studio
make db-migrate     # Run migrations
make db-seed        # Seed test data

# Logs
make logs           # Follow all logs
make logs-backend   # Backend logs only

# Shell access
make shell-backend  # Shell into backend container
```

## Security Testing

### WAF Test (SQLi)
```bash
# This should be BLOCKED (403)
curl -k "https://localhost/api/search?q=' OR '1'='1"
```

### WAF Test (XSS)
```bash
# This should be BLOCKED (403)
curl -k "https://localhost/api/search?q=<script>alert(1)</script>"
```

### Vault Status
```bash
curl -k https://localhost/status
```

## Key Files

- `docker-compose.yml` - Service orchestration
- `infra/modsecurity/` - WAF configuration
- `infra/vault/` - Vault configuration
- `mock_backend/` - Pong testbed application
- `scripts/init-vault.sh` - Vault initialization script
