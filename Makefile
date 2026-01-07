# ============================================
# ft_transcendence - Makefile
# ============================================

NAME = ft_transcendence
COMPOSE = docker compose

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
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ $(NAME) is running!$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(CYAN)→ App:       https://localhost$(NC)"
	@echo "$(CYAN)→ Vault UI:  https://localhost:8200/ui$(NC)"
	@echo "$(CYAN)→ Kibana:    https://localhost:5601$(NC)"
	@echo "$(CYAN)→ Grafana:   http://localhost:3000 (User: admin, Pass: see vault logs)$(NC)"
	@echo "$(CYAN)→ Prometheus: http://localhost:9090$(NC)"
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
# Vault
# ============================================

vault-token:
	@docker exec pong-vault cat /vault/file/init-status 2>/dev/null || echo "$(RED)Vault not running$(NC)"

# ============================================
# Logs & Monitoring
# ============================================

logs:
	@$(COMPOSE) logs -f

logs-%:
	@$(COMPOSE) logs -f $*

ps:
	@$(COMPOSE) ps

# ============================================
# Development
# ============================================

rebuild: down
	@$(COMPOSE) build --no-cache
	@$(COMPOSE) up -d

shell-%:
	@docker exec -it pong-$* sh

# ============================================
# Cleanup
# ============================================

clean: down
	@$(COMPOSE) down --remove-orphans

fclean:
	@echo "$(YELLOW)Removing everything...$(NC)"
	@$(COMPOSE) down -v --rmi local --remove-orphans 2>/dev/null || true
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
	@echo "  make          Build and start"
	@echo "  make up       Start services"
	@echo "  make down     Stop services"
	@echo "  make logs     Follow logs"
	@echo "  make logs-X   Follow logs for service X"
	@echo "  make ps       Show containers"
	@echo "  make shell-X  Shell into container X"
	@echo "  make clean    Remove containers"
	@echo "  make fclean   Remove everything"
	@echo "  make re       Full rebuild"

.PHONY: all build up down stop start restart logs ps rebuild clean fclean prune re help
