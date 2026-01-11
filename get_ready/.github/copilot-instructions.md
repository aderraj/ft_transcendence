# Transcendence - AI Coding Instructions

## Project Overview
A full-stack multiplayer Pong game with NestJS backend, React frontend, and Fastify game server. Features user management, friends system, real-time chat, OAuth authentication (42 & Google), and 2FA.

## Tech Stack
- **Backend**: NestJS (microservices) + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Game Server**: Fastify + WebSocket
- **Auth**: JWT + OAuth 2.0 (42 intra, Google) + TOTP 2FA
- **API Docs**: Swagger at `/api/docs` (backend) and game server

## Architecture

### Services (Docker)
```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (:3000)  │  Backend API (:3001)  │  Game (:3002)  │
│  React + Vite      │  NestJS               │  Fastify + WS  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    PostgreSQL (:5432)
```

### Backend Module Structure
```
backend/src/
├── auth/           # JWT, OAuth (42, Google), 2FA, guards, strategies
├── users/          # Profile, avatar upload, settings
├── friends/        # Friend requests, online status (WebSocket)
├── chat/           # Real-time messaging (WebSocket)
├── leaderboard/    # Rankings, game history
├── prisma/         # PrismaService singleton
└── common/         # Guards, decorators, utils
```

### Key Patterns

**Authentication Flow:**
1. Login/OAuth → Check active session → Generate JWT with sessionToken
2. JWT includes sessionToken for single-session enforcement
3. Each login invalidates previous sessions

**WebSocket Namespaces:**
- `/chat` - Real-time messaging
- `/friends` - Online status updates, friend requests, game invitations
- Game server uses raw WebSocket at `/websocket`

**CORS Configuration:**
Set `ALLOWED_ORIGINS` in `.env` (comma-separated):
```env
ALLOWED_ORIGINS=https://10.14.57.32:3000,https://localhost:3000
```

## Commands

### Docker
```bash
make up          # Start all services
make down        # Stop all services
make build       # Rebuild containers
make logs-back   # Backend logs
make seed        # Seed database with test data (manual)
make shell-back  # Shell into backend container
```

### Database
```bash
# Inside backend container
npx prisma migrate deploy    # Apply migrations
npx prisma generate          # Regenerate client
npx prisma studio            # Database GUI
```

## Environment Variables
Key variables in `.env`:
```env
ALLOWED_ORIGINS=<comma-separated URLs for CORS>
JWT_SECRET=<strong random string>
OAUTH_42_CLIENT_ID=<from 42 intra>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
USE_HTTPS=true
HOST_IP=<your server IP>
```

## API Conventions
- All routes prefixed with `/api`
- Use Swagger decorators: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
- Protected routes use `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`
- Public routes use `@Public()` decorator
- DTOs validated with `class-validator`

## Session Management
- Single active session per user enforced
- `POST /api/auth/logout` invalidates session
- Login fails with 403 if user has active session
- Session token stored in JWT and validated on each request

## WebSocket Events

### Chat (`/chat`)
- `message:send` → `{ receiverId, content }`
- `message:receive` → incoming message
- `typing:start/stop` → typing indicators

### Friends (`/friends`)
- `friend:status` → online/offline updates
- `friend:request_received` → new friend request notification
- `friend:accept_request` → accept friend request via WebSocket
- `friend:request_accepted` → friend request was accepted
- `friend:invite_game` → send game invitation
- `friend:game_invite_received` → receive game invitation
- `friend:respond_game_invite` → accept/decline game invite
- `friend:game_start` → match begins (with roomId)
- `friend:game_invite_declined` → game invite was declined

### Game Server (`/websocket`)
- `game_start` → match begins
- `moveUp/moveDown` → paddle movement
- `gameOver` → match ends

## File Locations
- Prisma schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`
- Swagger docs: `http://localhost:3001/api/docs`
- Avatar uploads: `backend/uploads/avatars/`

## References
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma + NestJS](https://docs.nestjs.com/recipes/prisma)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS OpenAPI/Swagger](https://docs.nestjs.com/openapi/introduction)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Passport 42 OAuth](http://www.passportjs.org/packages/passport-42/)
