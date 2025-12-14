# ============================================
# ft_transcendence - Makefile
# ============================================

NAME = ft_transcendence
COMPOSE = docker-compose

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
CYAN = \033[0;36m
NC = \033[0m

# Credentials file (gitignored, local only)
CREDS_FILE = .vault-credentials

# ============================================
# Main Target - Fully Automated
# ============================================

all: setup
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ $(NAME) is running!$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(CYAN)→ App:       https://localhost$(NC)"
	@echo "$(CYAN)→ Vault UI:  http://localhost:8200/ui$(NC)"
	@echo "$(CYAN)→ Vault login: make vault-token$(NC)"
	@echo ""

setup:
	@echo "$(YELLOW)═══ Building containers...$(NC)"
	@$(COMPOSE) build
	@echo ""
	@echo "$(YELLOW)═══ Starting Vault...$(NC)"
	@$(COMPOSE) up -d vault
	@echo "$(YELLOW)Waiting for Vault to be ready...$(NC)"
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker exec pong-vault vault status -format=json 2>/dev/null | jq -e '.initialized != null' > /dev/null 2>&1; then \
			break; \
		fi; \
		sleep 1; \
	done
	@$(MAKE) -s _vault_auto_setup

_vault_auto_setup:
	@INITIALIZED=$$(docker exec pong-vault vault status -format=json 2>/dev/null | jq -r '.initialized'); \
	SEALED=$$(docker exec pong-vault vault status -format=json 2>/dev/null | jq -r '.sealed'); \
	if [ "$$INITIALIZED" = "false" ]; then \
		echo "$(YELLOW)═══ Initializing Vault (first time)...$(NC)"; \
		$(MAKE) -s _vault_init_and_start; \
	elif [ "$$SEALED" = "true" ]; then \
		echo "$(YELLOW)═══ Unsealing Vault...$(NC)"; \
		$(MAKE) -s _vault_unseal_and_start; \
	else \
		echo "$(GREEN)✓ Vault already unsealed$(NC)"; \
		$(MAKE) -s _start_services; \
	fi

_vault_init_and_start:
	@INIT_OUTPUT=$$(docker exec pong-vault vault operator init -key-shares=1 -key-threshold=1 -format=json 2>/dev/null); \
	if [ -z "$$INIT_OUTPUT" ]; then \
		echo "$(RED)Failed to initialize Vault$(NC)"; \
		exit 1; \
	fi; \
	UNSEAL_KEY=$$(echo $$INIT_OUTPUT | jq -r '.unseal_keys_b64[0]'); \
	ROOT_TOKEN=$$(echo $$INIT_OUTPUT | jq -r '.root_token'); \
	echo "VAULT_UNSEAL_KEY=$$UNSEAL_KEY" > $(CREDS_FILE); \
	echo "VAULT_TOKEN=$$ROOT_TOKEN" >> $(CREDS_FILE); \
	chmod 600 $(CREDS_FILE); \
	echo "$(GREEN)✓ Credentials saved to $(CREDS_FILE) (gitignored)$(NC)"; \
	docker exec pong-vault vault operator unseal $$UNSEAL_KEY > /dev/null 2>&1; \
	echo "$(GREEN)✓ Vault unsealed$(NC)"; \
	sleep 2; \
	docker exec -e VAULT_TOKEN=$$ROOT_TOKEN pong-vault vault secrets enable -path=secret kv-v2 > /dev/null 2>&1 || true; \
	DB_PASS=$$(openssl rand -base64 16); \
	docker exec -e VAULT_TOKEN=$$ROOT_TOKEN pong-vault vault kv put secret/pong-app \
		admin_password="$$(openssl rand -base64 16)" \
		db_password="$$DB_PASS" \
		api_key="$$(openssl rand -hex 16)" \
		jwt_secret="$$(openssl rand -hex 32)" > /dev/null 2>&1; \
	echo "$(GREEN)✓ Secrets generated and stored in Vault$(NC)"; \
	echo ""; \
	echo "$(YELLOW)═══ Starting PostgreSQL...$(NC)"; \
	docker stop pong-postgres > /dev/null 2>&1 || true; \
	docker rm pong-postgres > /dev/null 2>&1 || true; \
	docker volume rm ft_transcendence_postgres-data > /dev/null 2>&1 || true; \
	DB_PASSWORD=$$DB_PASS $(COMPOSE) up -d postgres > /dev/null 2>&1; \
	echo "$(YELLOW)Waiting for PostgreSQL...$(NC)"; \
	for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker exec pong-postgres pg_isready -U pong -d pong > /dev/null 2>&1; then \
			break; \
		fi; \
		sleep 1; \
	done; \
	echo ""; \
	echo "$(YELLOW)═══ Starting remaining services...$(NC)"; \
	VAULT_TOKEN=$$ROOT_TOKEN DB_PASSWORD=$$DB_PASS $(COMPOSE) up -d; \
	echo "$(YELLOW)Waiting for backend to connect...$(NC)"; \
	sleep 5; \
	$(MAKE) -s _health_check

_vault_unseal_and_start:
	@if [ ! -f $(CREDS_FILE) ]; then \
		echo "$(RED)✗ No credentials file found$(NC)"; \
		echo "$(YELLOW)  Run 'make re' to reinitialize$(NC)"; \
		exit 1; \
	fi; \
	. ./$(CREDS_FILE) && \
	docker exec pong-vault vault operator unseal $$VAULT_UNSEAL_KEY > /dev/null 2>&1 && \
	echo "$(GREEN)✓ Vault unsealed$(NC)" && \
	sleep 1 && \
	DB_PASS=$$(docker exec -e VAULT_TOKEN=$$VAULT_TOKEN pong-vault vault kv get -field=db_password secret/pong-app 2>/dev/null) && \
	echo "" && \
	echo "$(YELLOW)═══ Starting services...$(NC)" && \
	VAULT_TOKEN=$$VAULT_TOKEN DB_PASSWORD=$$DB_PASS $(COMPOSE) up -d && \
	echo "$(YELLOW)Waiting for backend...$(NC)" && \
	sleep 3 && \
	$(MAKE) -s _health_check

_start_services:
	@. ./$(CREDS_FILE) && \
	DB_PASS=$$(docker exec -e VAULT_TOKEN=$$VAULT_TOKEN pong-vault vault kv get -field=db_password secret/pong-app 2>/dev/null) && \
	echo "" && \
	echo "$(YELLOW)═══ Starting services...$(NC)" && \
	VAULT_TOKEN=$$VAULT_TOKEN DB_PASSWORD=$$DB_PASS $(COMPOSE) up -d && \
	echo "$(YELLOW)Waiting for backend...$(NC)" && \
	sleep 3 && \
	$(MAKE) -s _health_check

_health_check:
	@for i in 1 2 3 4 5; do \
		if curl -sk https://localhost/api/health | jq -e '.status == "operational"' > /dev/null 2>&1; then \
			echo "$(GREEN)✓ All services healthy$(NC)"; \
			exit 0; \
		fi; \
		echo "$(YELLOW)Waiting for services... ($$i/5)$(NC)"; \
		sleep 2; \
	done; \
	echo "$(RED)⚠ Services may not be fully ready - check 'make logs'$(NC)"

build:
	@echo "$(YELLOW)Building containers...$(NC)"
	@$(COMPOSE) build

up:
	@echo "$(YELLOW)Starting services...$(NC)"
	@$(COMPOSE) up -d vault
	@sleep 2
	@$(MAKE) -s _vault_auto_setup

down:
	@echo "$(YELLOW)Stopping services...$(NC)"
	@$(COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

stop:
	@$(COMPOSE) stop

start:
	@$(COMPOSE) start
	@sleep 2
	@$(MAKE) -s _vault_auto_setup

restart: down up

# ============================================
# Vault Management (Manual)
# ============================================

vault-status:
	@docker exec pong-vault vault status 2>/dev/null || echo "$(RED)Vault not running$(NC)"

vault-token:
	@if [ -f $(CREDS_FILE) ]; then \
		echo "$(YELLOW)═══ Vault Credentials ═══$(NC)"; \
		echo "$(CYAN)Use this token to login at http://localhost:8200/ui$(NC)"; \
		echo ""; \
		cat $(CREDS_FILE); \
		echo ""; \
	else \
		echo "$(RED)No credentials file - run 'make' first$(NC)"; \
	fi

vault-secrets:
	@echo "$(YELLOW)Vault Secrets (masked):$(NC)"
	@curl -sk https://localhost/api/vault/status | jq '.secrets' 2>/dev/null || \
		echo "$(RED)Backend not responding$(NC)"

# ============================================
# Logs & Debugging
# ============================================

logs:
	@$(COMPOSE) logs -f

logs-backend:
	@$(COMPOSE) logs -f backend

logs-waf:
	@$(COMPOSE) logs -f waf

logs-vault:
	@$(COMPOSE) logs -f vault

logs-db:
	@$(COMPOSE) logs -f postgres

ps:
	@$(COMPOSE) ps

health:
	@echo "$(YELLOW)Health Check:$(NC)"
	@curl -sk https://localhost/api/health | jq . 2>/dev/null || \
		echo "$(RED)Backend not responding$(NC)"

# ============================================
# Development
# ============================================

rebuild: down
	@echo "$(YELLOW)Rebuilding from scratch...$(NC)"
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	@echo "$(GREEN)✓ Rebuild complete$(NC)"

rebuild-backend:
	$(COMPOSE) build --no-cache backend
	$(COMPOSE) up -d backend

rebuild-frontend:
	$(COMPOSE) build --no-cache frontend
	$(COMPOSE) up -d frontend

shell-backend:
	docker exec -it pong-backend sh

shell-db:
	docker exec -it pong-postgres psql -U pong -d pong

shell-vault:
	@docker exec -it pong-vault sh

# ============================================
# Cleanup
# ============================================

clean: down
	@echo "$(YELLOW)Removing containers and networks...$(NC)"
	@$(COMPOSE) down --remove-orphans
	@echo "$(GREEN)✓ Cleaned$(NC)"

fclean:
	@echo "$(YELLOW)Removing everything...$(NC)"
	@$(COMPOSE) down -v --rmi local --remove-orphans 2>/dev/null || true
	@rm -f $(CREDS_FILE)
	@echo "$(GREEN)✓ Full clean complete$(NC)"

prune: fclean
	@echo "$(YELLOW)Pruning Docker system...$(NC)"
	@docker system prune -af --volumes
	@echo "$(GREEN)✓ Docker pruned$(NC)"

re: fclean all

# ============================================
# Testing
# ============================================

test-waf:
	@echo "$(YELLOW)Testing WAF (SQL Injection):$(NC)"
	@curl -sk "https://localhost/api/users/search?q=%27%3BDROP%20TABLE" | head -1
	@echo ""
	@echo "$(GREEN)✓ Should show 403 Forbidden$(NC)"

test-api:
	@echo "$(YELLOW)Testing API endpoints:$(NC)"
	@echo "Health:" && curl -sk https://localhost/api/health | jq -c .
	@echo "Leaderboard:" && curl -sk https://localhost/api/users/leaderboard | jq -c .

# ============================================
# Help
# ============================================

help:
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  ft_transcendence Makefile$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)Quick Start:$(NC)"
	@echo "  make              Build and start everything (fully automated)"
	@echo "  make re           Full rebuild from scratch"
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@echo "  make up           Start services (auto-unseals Vault)"
	@echo "  make down         Stop all services"
	@echo "  make restart      Restart all services"
	@echo "  make ps           Show running containers"
	@echo ""
	@echo "$(YELLOW)Monitoring:$(NC)"
	@echo "  make health       Check service health"
	@echo "  make logs         Follow all logs"
	@echo "  make logs-backend Follow backend logs"
	@echo "  make vault-secrets Show secrets (masked)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make shell-backend Enter backend container"
	@echo "  make shell-db      Enter PostgreSQL shell"
	@echo "  make shell-vault   Enter Vault container"
	@echo ""
	@echo "$(YELLOW)Cleanup:$(NC)"
	@echo "  make clean        Remove containers"
	@echo "  make fclean       Remove everything + credentials"
	@echo ""
	@echo "$(YELLOW)Testing:$(NC)"
	@echo "  make test-waf     Test WAF blocking"
	@echo "  make test-api     Test API endpoints"

.PHONY: all setup build up down stop start restart \
        vault-status vault-token vault-secrets \
        _vault_auto_setup _vault_init_and_start _vault_unseal_and_start _start_services _health_check \
        logs logs-backend logs-waf logs-vault logs-db ps health \
        rebuild rebuild-backend rebuild-frontend \
        shell-backend shell-db shell-vault \
        clean fclean prune re \
        test-waf test-api help
