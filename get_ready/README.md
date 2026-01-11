# Transcendence - Multiplayer Pong Game

A NestJS backend + React frontend for a multiplayer Pong game with user management, matchmaking, friends system, and leaderboards.

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT Authentication
- **Frontend**: React, Vite, TypeScript, Axios
- **Infrastructure**: Docker, Docker Compose

## Quick Start

### Prerequisites
- Docker & Docker Compose installed

### Run the Project

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api |
| **Swagger Docs** | http://localhost:3000/api |

## API Documentation

Swagger/OpenAPI documentation is available at: **http://localhost:3000/api**

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/test-login` - Get test token (dev)
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/avatar` - Upload avatar
- `DELETE /api/users/me/avatar` - Remove avatar

#### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/request/:userId` - Send friend request
- `POST /api/friends/request/:id/accept` - Accept request
- `POST /api/friends/request/:id/decline` - Decline request
- `DELETE /api/friends/:friendId` - Remove friend

#### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/me` - Get my stats
- `GET /api/leaderboard/me/history` - Get my game history

## Test Users

After seeding the database, these test users are available:

| Username | Password | ELO |
|----------|----------|-----|
| reda | password1 | 1200 |
| samir | password2 | 1100 |
| aymen | password3 | 1050 |
| karim | password4 | 1000 |
| user5 | password5 | 950 |

### Seed the Database

```bash
docker exec transcendence-backend npx ts-node prisma/seed.ts
```

## Development Commands

```bash
# Rebuild after changes
docker-compose up -d --build

# Run database migrations
docker exec transcendence-backend npx prisma migrate dev --name <name>

# Open Prisma Studio (database GUI)
docker exec -it transcendence-backend npx prisma studio

# Access PostgreSQL CLI
docker exec -it transcendence-db psql -U transcendence
```

## Project Structure

```
transcendence/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication (JWT, OAuth)
│   │   ├── users/         # User management
│   │   ├── friends/       # Friend system
│   │   ├── leaderboard/   # Rankings & stats
│   │   └── prisma/        # Database service
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Test data
└── frontend/
    └── src/
        ├── App.tsx        # Main application
        └── api.ts         # API client
```

## Features

- ✅ User registration & login (username/password)
- ✅ JWT authentication
- ✅ User profile management
- ✅ Avatar upload
- ✅ Friends system (requests, accept/decline)
- ✅ Leaderboard with ELO rankings
- ✅ Game history
- ✅ Swagger API documentation
- 🔄 42 OAuth (coming soon)
- 🔄 Real-time game (coming soon)
- 🔄 2FA (coming soon)
