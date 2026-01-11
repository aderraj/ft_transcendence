.PHONY: help up down restart build clean logs ps health test seed

# Default target
help:
	@echo "🎮 Transcendence - Available Commands:"
	@echo ""
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Rebuild all containers"
	@echo "  make clean       - Stop and remove all containers, networks, and volumes"
	@echo "  make logs        - View logs from all services"
	@echo "  make logs-back   - View backend logs"
	@echo "  make logs-front  - View frontend logs"
	@echo "  make logs-db     - View database logs"
	@echo "  make ps          - List running containers"
	@echo "  make health      - Check health status of all services"
	@echo "  make shell-back  - Open shell in backend container"
	@echo "  make shell-front - Open shell in frontend container"
	@echo "  make shell-db    - Open PostgreSQL shell"
	@echo "  make test        - Run backend tests"
	@echo "  make seed        - Seed the database with test data"
	@echo ""

# Start all services
up:
	docker-compose up -d
	@echo "✅ All services started!"
	@echo "🌐 Frontend: https://$(shell hostname -I | awk '{print $$1}'):3000"
	@echo "🔧 Backend API: https://$(shell hostname -I | awk '{print $$1}'):3001/api"

# Stop all services
down:
	docker-compose down
	@echo "✅ All services stopped!"

# Restart all services
restart:
	docker-compose restart
	@echo "✅ All services restarted!"

# Rebuild all containers
build:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ All services rebuilt and started!"

# Clean everything (including volumes)
clean:
	@echo "⚠️  This will remove all containers, networks, and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker system prune -f; \
		echo "✅ Cleanup complete!"; \
	else \
		echo "❌ Cleanup cancelled"; \
	fi

# View logs
logs:
	docker-compose logs -f

logs-back:
	docker-compose logs -f backend

logs-front:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# List running containers
ps:
	docker-compose ps

# Check health status
health:
	@echo "🏥 Health Status:"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' transcendence-backend 2>/dev/null || echo "Backend: Not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' transcendence-frontend 2>/dev/null || echo "Frontend: Not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' transcendence-db 2>/dev/null || echo "Database: Not running"

# Open shells
shell-back:
	docker exec -it transcendence-backend sh

shell-front:
	docker exec -it transcendence-frontend sh

shell-db:
	docker exec -it transcendence-db psql -U transcendence

# Run tests
test:
	docker exec transcendence-backend npm test

# Seed the database with test data
seed:
	@echo "🌱 Seeding database..."
	docker exec transcendence-backend npx prisma db seed
	@echo "✅ Database seeded successfully!"
