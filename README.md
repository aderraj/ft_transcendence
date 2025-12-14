# ft_transcendence

*This project has been created as part of the 42 curriculum.*

## Description

ft_transcendence - Security & DevOps Infrastructure for a Pong Web Application.

This repository implements the **Cybersecurity** and **DevOps** modules:
- **WAF (Web Application Firewall)**: Nginx + ModSecurity with OWASP Core Rule Set
- **Secrets Management**: Self-managed HashiCorp Vault

## Architecture

```
[Internet] → [WAF/Nginx:443] → [Pong Backend:3000] ← [Vault:8200]
                  ↓
            secure_net (isolated network)
```

## Quick Start

```bash
# 1. Start the infrastructure
docker-compose up --build -d

# 2. Initialize Vault (first time only)
chmod +x scripts/init-vault.sh
./scripts/init-vault.sh

# 3. Copy the VAULT_TOKEN to .env
cp .env.example .env
# Edit .env with the token from step 2

# 4. Restart backend to connect to Vault
docker-compose restart backend

# 5. Access the Pong App
# https://localhost (accept self-signed cert)
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
