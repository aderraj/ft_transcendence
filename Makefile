# ============================================
# ft_transcendence - Makefile
# ============================================

NAME = ft_transcendence
COMPOSE = docker compose

# Load HOST_IP from .env file
HOST_IP := $(shell grep -E '^HOST_IP=' .env 2>/dev/null | cut -d'=' -f2 || echo "localhost")

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
CYAN = \033[0;36m
NC = \033[0m

# ============================================
# Main Targets
# ============================================

all: build up
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)   ✓ $(NAME) is running!$(NC)"
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)📱 Application$(NC)"
	@echo "   → Frontend:      $(GREEN)https://$(HOST_IP)$(NC)"
	@echo "   → Backend API:   $(GREEN)https://$(HOST_IP)/api$(NC)"
	@echo "   → API Docs:      $(GREEN)https://$(HOST_IP)/api/docs$(NC)"
	@echo ""
	@echo "$(CYAN)📊 Monitoring & Dashboards$(NC)"
	@echo "   → Grafana:       $(GREEN)http://$(HOST_IP):3003$(NC)       (admin/see vault-secrets)"
	@echo "   → Prometheus:    $(GREEN)http://$(HOST_IP):9090$(NC)"
	@echo "   → Alertmanager:  $(GREEN)http://$(HOST_IP):9093$(NC)"
	@echo ""
	@echo "$(CYAN)📝 Logging (ELK Stack)$(NC)"
	@echo "   → Kibana:        $(GREEN)https://$(HOST_IP):5601$(NC)      (elastic/see vault-secrets)"
	@echo ""
	@echo "$(CYAN)🔐 Security$(NC)"
	@echo "   → Vault UI:      $(GREEN)https://$(HOST_IP):8200/ui$(NC)   (see vault-token)"
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)💡 Tips:$(NC)"
	@echo "   • Run $(CYAN)make vault-token$(NC) for Vault credentials"
	@echo "   • Run $(CYAN)make status$(NC) to check all services"
	@echo "   • Run $(CYAN)make logs$(NC) to follow logs"
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""

build:
	@echo "$(YELLOW)Building containers...$(NC)"
	@$(COMPOSE) build

up:
	@echo "$(YELLOW)Starting services...$(NC)"
	@$(COMPOSE) up -d
	@echo "$(GREEN)✓ Services started$(NC)"

down:
	@echo "$(YELLOW)Stopping services...$(NC)"
	@$(COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

stop:
	@$(COMPOSE) stop

start:
	@$(COMPOSE) start

restart: down up

# ============================================
# Quick Start (Core Services Only)
# ============================================

dev: build-core up-core
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)   ✓ Core services running (dev mode)$(NC)"
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)📱 Application$(NC)"
	@echo "   → Frontend:      $(GREEN)https://$(HOST_IP)$(NC)"
	@echo ""
	@echo "$(CYAN)🔐 Security$(NC)"
	@echo "   → Vault UI:      $(GREEN)https://$(HOST_IP):8200/ui$(NC)   (see vault-token)"
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)💡 Run $(CYAN)make all$(YELLOW) for full stack with monitoring$(NC)"
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""

build-core:
	@echo "$(YELLOW)Building core services...$(NC)"
	@$(COMPOSE) build ssl-init vault postgres backend frontend game waf

up-core:
	@echo "$(YELLOW)Starting core services...$(NC)"
	@$(COMPOSE) up -d ssl-init vault postgres backend frontend game waf
	@echo "$(GREEN)✓ Core services started$(NC)"

# ============================================
# Vault
# ============================================

vault-token:
	@echo "$(CYAN)Vault Credentials:$(NC)"
	@docker exec pong-vault cat /vault/file/init-status 2>/dev/null || echo "$(RED)Vault not running$(NC)"

vault-secrets:
	@echo "$(CYAN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)   Vault Secrets Status$(NC)"
	@echo "$(CYAN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Secret Files:$(NC)"
	@docker exec pong-vault sh -c 'for f in /secrets/*; do [ -f "$$f" ] && name=$$(basename $$f) && size=$$(wc -c < $$f) && [ "$$name" != ".ready" ] && echo "  ✓ $$name ($$size bytes)"; done' 2>/dev/null || echo "$(RED)Vault not running$(NC)"
	@echo ""
	@echo "$(YELLOW)To update secrets, run: $(CYAN)make vault-update$(NC)"
	@echo ""

vault-update:
	@echo "$(YELLOW)Updating Vault secrets...$(NC)"
	@./scripts/update-vault-secrets.sh

# ============================================
# Database
# ============================================

db-studio:
	@echo "$(YELLOW)Opening Prisma Studio...$(NC)"
	@docker exec -it pong-backend sh -c 'export DATABASE_URL="postgresql://transcendence:$$(cat /secrets/db_password)@postgres:5432/transcendence?schema=public" && npx prisma studio'

db-migrate:
	@echo "$(YELLOW)Running database migrations...$(NC)"
	@docker exec -it pong-backend sh -c 'export DATABASE_URL="postgresql://transcendence:$$(cat /secrets/db_password)@postgres:5432/transcendence?schema=public" && npx prisma migrate deploy'

db-seed:
	@echo "$(YELLOW)Seeding database...$(NC)"
	@docker exec -it pong-backend sh -c 'export DATABASE_URL="postgresql://transcendence:$$(cat /secrets/db_password)@postgres:5432/transcendence?schema=public" && npx prisma db seed'

db-reset:
	@echo "$(RED)Resetting database...$(NC)"
	@docker exec -it pong-backend sh -c 'export DATABASE_URL="postgresql://transcendence:$$(cat /secrets/db_password)@postgres:5432/transcendence?schema=public" && npx prisma migrate reset --force'

# ============================================
# Logs & Monitoring
# ============================================

logs:
	@$(COMPOSE) logs -f

logs-%:
	@$(COMPOSE) logs -f $*

ps:
	@$(COMPOSE) ps

status:
	@echo "$(CYAN)Service Status:$(NC)"
	@$(COMPOSE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

links:
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)   🔗 Available Links$(NC)"
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)📱 Application$(NC)"
	@echo "   → Frontend:      $(GREEN)https://$(HOST_IP)$(NC)"
	@echo "   → Backend API:   $(GREEN)https://$(HOST_IP)/api$(NC)"
	@echo "   → API Docs:      $(GREEN)https://$(HOST_IP)/api/docs$(NC)"
	@echo ""
	@echo "$(CYAN)📊 Monitoring & Dashboards$(NC)"
	@echo "   → Grafana:       $(GREEN)http://$(HOST_IP):3003$(NC)       (admin/see vault-secrets)"
	@echo "   → Prometheus:    $(GREEN)http://$(HOST_IP):9090$(NC)"
	@echo "   → Alertmanager:  $(GREEN)http://$(HOST_IP):9093$(NC)"
	@echo ""
	@echo "$(CYAN)📝 Logging (ELK Stack)$(NC)"
	@echo "   → Kibana:        $(GREEN)https://$(HOST_IP):5601$(NC)      (elastic/see vault-secrets)"
	@echo ""
	@echo "$(CYAN)🔐 Security$(NC)"
	@echo "   → Vault UI:      $(GREEN)https://$(HOST_IP):8200/ui$(NC)   (see vault-token)"
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""

# ============================================
# Development
# ============================================

rebuild: down
	@$(COMPOSE) build --no-cache
	@$(COMPOSE) up -d

rebuild-%:
	@$(COMPOSE) build --no-cache $*
	@$(COMPOSE) up -d $*

shell-%:
	@docker exec -it pong-$* sh

shell-backend:
	@docker exec -it pong-backend bash

# ============================================
# Testing
# ============================================

test:
	@echo "$(YELLOW)Running backend tests...$(NC)"
	@docker exec -it pong-backend npm test

test-watch:
	@docker exec -it pong-backend npm run test:watch

lint:
	@echo "$(YELLOW)Running linter...$(NC)"
	@docker exec -it pong-backend npm run lint

# ============================================
# Cleanup
# ============================================

clean: down
	@$(COMPOSE) down --remove-orphans

fclean:
	@echo "$(YELLOW)Removing everything...$(NC)"
	@$(COMPOSE) down -v --rmi local --remove-orphans 2>/dev/null || true
	@rm -rf ssl/*.pem 2>/dev/null || true
	@echo "$(GREEN)✓ Full clean complete$(NC)"

prune: fclean
	@docker system prune -af --volumes

re: fclean all

# ============================================
# Help
# ============================================

help:
	@echo "$(GREEN)ft_transcendence$(NC)"
	@echo ""
	@echo "$(CYAN)Main Commands:$(NC)"
	@echo "  make            Build and start all services"
	@echo "  make dev        Start core services only (faster)"
	@echo "  make up         Start services"
	@echo "  make down       Stop services"
	@echo "  make restart    Restart all services"
	@echo ""
	@echo "$(CYAN)Logs & Status:$(NC)"
	@echo "  make logs       Follow all logs"
	@echo "  make logs-X     Follow logs for service X (backend, frontend, game, etc.)"
	@echo "  make ps         Show container status"
	@echo "  make status     Show detailed status"
	@echo "  make links      Show all available URLs"
	@echo ""
	@echo "$(CYAN)Database:$(NC)"
	@echo "  make db-studio  Open Prisma Studio"
	@echo "  make db-migrate Run migrations"
	@echo "  make db-seed    Seed database"
	@echo "  make db-reset   Reset database"
	@echo ""
	@echo "$(CYAN)Development:$(NC)"
	@echo "  make shell-X    Shell into container X (backend, frontend, game)"
	@echo "  make rebuild    Rebuild all (no cache)"
	@echo "  make rebuild-X  Rebuild service X"
	@echo "  make test       Run tests"
	@echo "  make lint       Run linter"
	@echo ""
	@echo "$(CYAN)Vault:$(NC)"
	@echo "  make vault-token   Show Vault credentials"
	@echo "  make vault-secrets List available secrets"
	@echo ""
	@echo "$(CYAN)Cleanup:$(NC)"
	@echo "  make clean      Remove containers"
	@echo "  make fclean     Remove everything"
	@echo "  make re         Full rebuild"

.PHONY: all build up down stop start restart dev build-core up-core \
        vault-token vault-secrets db-studio db-migrate db-seed db-reset \
        logs ps status links rebuild test test-watch lint clean fclean prune re help
