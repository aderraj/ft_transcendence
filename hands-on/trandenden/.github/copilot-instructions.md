# Transcendence Backend - Copilot Instructions

## Project Context
NestJS backend for a multiplayer Pong game with 42 OAuth, user management, friends system, matchmaking, and real-time chat. **Urgent deadline** - build on existing code to complete features quickly.

## Architecture Overview

### Module Structure (src/)
```
src/
├── auth/          # JWT + OAuth 2.0 (42 intra), 2FA with TOTP
├── user/          # Profile, avatar uploads, settings
├── friends/       # Friend requests (PENDING/ACCEPTED/REJECTED status)
├── game/          # Matchmaking, WebSocket game rooms, Pong logic (TO BE BUILT)
├── leaderboard/   # Rankings, match history (TO BE BUILT)
├── prisma/        # Singleton PrismaService for DB access
└── common/        # Guards, decorators, DTOs, filters (TO BE BUILT)
```

### Database Schema (Prisma)
- **User**: `status` enum (ONLINE/OFFLINE/IN_GAME), 2FA fields, profile pic
- **FriendRequest**: `senderId`, `receiverId`, `status` (PENDING/ACCEPTED/REJECTED)
- **Friendship**: Bidirectional with `userId1`/`userId2`, supports `isBlocked`
- **Conversation**: Linked to `Friendship`, has `messages` relation
- **ConversationMessage**: Chat between friends only, `isVisible` for soft delete
- **Match**: Stores `user1Score`, `user2Score`, `winnerId`, game history

### Key Patterns

**Prisma Service Injection**  
All modules import `PrismaModule` and inject `PrismaService` for DB access. See `src/prisma/prisma.service.ts` - extends `PrismaClient` with lifecycle hooks.

**Global Validation**  
`main.ts` uses `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` - all DTOs validated with `class-validator` decorators (see `src/auth/dto/auth.dto.ts`).

**API Prefix**  
All routes prefixed with `/api` via `app.setGlobalPrefix('api')` in `main.ts`. No Swagger setup yet - needs to be added.

**Authentication Flow**  
- `POST /api/auth/register` - Email/password registration with bcrypt hashing
- `POST /api/auth/login` - Email/password login returns JWT token
- `GET /api/auth/42` - Redirects to 42 OAuth login page
- `GET /api/auth/42/callback` - 42 OAuth callback, creates/updates user, returns JWT
- Protected routes use `@UseGuards(JwtAuthGuard)` 
- Public routes use `@Public()` decorator to bypass global guard
- JWT tokens contain `userId`, `email`, `username` payload

**Friend System Rules**  
- Users can only send messages to accepted friends (check `Friendship` table)
- Friend requests flow: PENDING → ACCEPTED/REJECTED
- Block functionality via `Friendship.isBlocked` field

**Chat System (WebSocket)**  
- Gateway: `ChatGateway` at `/chat` namespace
- Events: `sendMessage`, `messageReceived`, `userOnline`, `userOffline`
- Authentication: JWT token required in WebSocket handshake
- Friend-only messaging enforced server-side
- Messages stored in `ConversationMessage` table linked to `Conversation`

## Development Workflow

### Docker (Primary Method)
```bash
# Start services (PostgreSQL + NestJS)
make up          # or: sudo docker compose up

# Rebuild after code/dependency changes
make build       # or: sudo docker compose up --build

# Clean restart (removes volumes)
make re          # or: sudo docker compose down -v && docker compose up --build

# View logs
make logs        # or: sudo docker compose logs -f

# Access PostgreSQL
sudo docker exec -it postgres-db psql -U transcendence
```

### Inside Container
```bash
# Database migrations
npx prisma migrate dev --name <migration_name>
npx prisma generate          # After schema changes
npx prisma studio            # Visual DB browser

# Code generation
nest g resource <name>       # Scaffold full CRUD module
nest g module/service/controller <name>
```

### Local Development
Use `yarn start:dev` for watch mode (auto-restarts). Port 3001 by default.

### API Documentation
Swagger UI available at: `http://localhost:3001/api` (after `make up`)

### Testing Auth Flow
```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 42 OAuth (open in browser)
http://localhost:3001/api/auth/42
```

## Setup Instructions

### 1. Install Required Dependencies
```bash
# Inside container or locally
yarn add @nestjs/passport @nestjs/jwt passport passport-jwt passport-42 @nestjs/swagger bcrypt @nestjs/platform-socket.io
yarn add -D @types/passport-jwt @types/passport-42 @types/bcrypt
```

### 2. Configure Environment Variables
Add to `.env`:
```
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRATION=7d
OAUTH_42_CLIENT_ID=your_42_app_uid
OAUTH_42_CLIENT_SECRET=your_42_app_secret
OAUTH_42_CALLBACK_URL=http://localhost:3001/api/auth/42/callback
```

### 3. 42 OAuth Setup
1. Go to https://profile.intra.42.fr/oauth/applications/new
2. Create new application with callback URL: `http://localhost:3001/api/auth/42/callback`
3. Copy UID → `OAUTH_42_CLIENT_ID`
4. Copy SECRET → `OAUTH_42_CLIENT_SECRET`

## Critical TODOs
1. ✅ **Auth**: JWT strategy, 42 OAuth, guards implemented
2. **Game**: WebSocket gateway for real-time Pong, matchmaking queue, ELO pairing
3. ✅ **Chat**: Simple WebSocket chat with friend-only restriction
4. **Leaderboard**: Rankings calculation, match history endpoints
5. ✅ **Swagger**: Configured at `/api` endpoint
6. ✅ **Common**: Guards (`JwtAuthGuard`, `Jwt42Guard`), decorators (`@Public()`), exception filters

## Integration Points
- **PostgreSQL**: Accessed via `PrismaService`, connection string in `.env` (`DATABASE_URL`)
- **42 OAuth**: Needs client ID/secret in `.env`, callback route at `/auth/42/callback`
- **WebSockets**: Use `@nestjs/platform-socket.io` for game + chat (install required)
- **Rate Limiting**: Add `@nestjs/throttler` to protect endpoints

## Code Conventions
- DTOs: Use `class-validator` decorators (`@IsEmail`, `@IsNotEmpty`, `@MinLength`)
- Prisma relations: Always use `onDelete: Cascade` for cleanup
- Error handling: Throw NestJS exceptions (`UnauthorizedException`, `NotFoundException`)
- Status tracking: Update `User.status` on login/logout/game start for friends list

## Environment Variables (.env)
```
DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=transcendence
JWT_SECRET=<random_secret>
OAUTH_42_CLIENT_ID=<from_42_app>
OAUTH_42_CLIENT_SECRET=<from_42_app>
```

## References
- [NestJS Docs](https://docs.nestjs.com/) - Main framework reference
- [Prisma + NestJS](https://docs.nestjs.com/recipes/prisma) - ORM integration
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways) - Real-time communication
- [NestJS Auth](https://docs.nestjs.com/security/authentication) - JWT + OAuth patterns
