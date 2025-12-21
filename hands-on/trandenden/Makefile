# Makefile for NestJS Docker Development

# Default target
.PHONY: all
all: up

# Start containers
.PHONY: up
up:
	sudo docker compose up

# Start containers in background
.PHONY: up-d
up-d:
	sudo docker compose up -d

# Build and start containers
.PHONY: build
build:
	sudo docker compose up --build

# Rebuild everything (clear volumes, rebuild)
.PHONY: re
re:
	sudo docker compose down -v
	sudo docker compose up --build

# Rebuild with detached mode
.PHONY: red
red:
	sudo docker compose down -v
	sudo docker compose up --build -d

# Stop containers
.PHONY: down
down:
	sudo docker compose down

# Stop and remove volumes
.PHONY: clean
clean:
	sudo docker compose down -v

# Full clean (volumes + images)
.PHONY: fclean
fclean:
	sudo docker compose down -v --rmi all

# View logs
.PHONY: logs
logs:
	sudo docker compose logs -f

# View logs for api only
.PHONY: logs-api
logs-api:
	sudo docker compose logs -f api

# View logs for postgres only
.PHONY: logs-db
logs-db:
	sudo docker compose logs -f postgres

# Enter api container shell
.PHONY: shell
shell:
	sudo docker compose exec api sh

# Enter postgres container shell
.PHONY: shell-db
shell-db:
	sudo docker compose exec postgres psql -U postgres -d trandenden

# Run prisma commands
.PHONY: prisma-generate
prisma-generate:
	npx prisma generate

.PHONY: prisma-migrate
prisma-migrate:
	npx prisma migrate dev

.PHONY: prisma-studio
prisma-studio:
	npx prisma studio

# Restart only api container
.PHONY: restart-api
restart-api:
	sudo docker compose restart api

# Show running containers
.PHONY: ps
ps:
	sudo docker compose ps

# Help
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make up            - Start containers"
	@echo "  make up-d          - Start containers in background"
	@echo "  make build         - Build and start containers"
	@echo "  make re            - Rebuild everything (clear volumes)"
	@echo "  make red           - Rebuild everything (detached)"
	@echo "  make down          - Stop containers"
	@echo "  make clean         - Stop and remove volumes"
	@echo "  make fclean        - Full clean (volumes + images)"
	@echo "  make logs          - View all logs"
	@echo "  make logs-api      - View api logs"
	@echo "  make logs-db       - View postgres logs"
	@echo "  make shell         - Enter api container shell"
	@echo "  make shell-db      - Enter postgres/psql shell"
	@echo "  make prisma-generate - Generate Prisma client"
	@echo "  make prisma-migrate  - Run Prisma migrations"
	@echo "  make prisma-studio   - Open Prisma Studio"
	@echo "  make restart-api   - Restart api container"
	@echo "  make ps            - Show running containers"
