# Transcendence Backend - AI Coding Instructions

## Project Overview
A NestJS microservice backend for a multiplayer Pong game with user management, matchmaking, friends system, and leaderboards. Uses 42 OAuth for authentication.

## Tech Stack
- **Framework**: NestJS (microservices architecture)
- **ORM**: Prisma with PostgreSQL
- **Auth**: JWT + OAuth 2.0 (42 intra)
- **API Docs**: Swagger/OpenAPI at `/api`

## Architecture Patterns

### Module Structure
Follow NestJS modular architecture. Each feature gets its own module:
```
src/
├── auth/           # JWT, OAuth, 2FA, guards
├── users/          # Profile, avatar, settings
├── friends/        # Friend requests, online status
├── game/           # Matchmaking, game rooms, Pong logic
├── leaderboard/    # Rankings, seasonal stats
├── prisma/         # PrismaService singleton
└── common/         # Guards, decorators, DTOs, filters
```

### Prisma Service Pattern
Create a singleton `PrismaService` extending `PrismaClient`:
```typescript
@Injectable()
export class PrismaServ
  - Return token in response for frontend storage
- [ ] Add OAuth guard for `/api/auth/42` route
- [ ] Update Prisma schema to include `intraId` field ice extends PrismaClient {
  constructor() {
    super({ datasources: { db: { url: process.env.DATABASE_URL } } });
  }
}
```

### Authentication Flow
1. **42 OAuth**: `/auth/42/callback` → validate with 42 API → issue JWT
2. **JWT Guard**: Apply `@UseGuards(JwtAuthGuard)` or use global guard with `@Public()` decorator for public routes
3. **2FA**: Optional TOTP verification after initial login

### API Conventions
- Prefix all routes with `/api`
- Use Swagger decorators: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
- DTOs with `class-validator` decorators for validation
- Return consistent response shapes

### Swagger Setup (main.ts)
```typescript
const config = new DocumentBuilder()
  .setTitle('Transcendence API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

## Key Implementation Guidelines

### User Management
- Store hashed passwords with bcrypt (for non-OAuth users if any)
- Default avatar fallback when none uploaded
- Track `isOnline` status for friends list

### Friends System
- Friend request states: `PENDING`, `ACCEPTED`, `DECLINED`
- Query online status from user's last activity or WebSocket connection

### Game/Matchmaking
- Use WebSockets (`@nestjs/platform-socket.io`) for real-time game state
- Matchmaking queue with ELO-based pairing
- Game rooms track player connections and game state

### Rate Limiting
Apply `@nestjs/throttler` to protect endpoints:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
```

## Commands

### Docker (Recommended)
```bash
# Start all services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after dependency changes
docker-compose up -d --build backend

# Access PostgreSQL CLI
docker exec -it transcendence-db psql -U transcendence
```

### Local Development (inside container or host)
```bash
# Development
npm run start:dev

# Database migrations
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio

# Generate resources
nest g resource <name>
nest g module/service/controller <name>
```

## Project Structure
```
transcendence/
├── docker-compose.yml     # PostgreSQL + Backend services
├── .env                   # Environment variables (DO NOT COMMIT)
├── backend/
│   ├── Dockerfile.dev     # Development container
│   ├── src/               # NestJS source code
│   └── prisma/            # Database schema & migrations
└── frontend/              # (separate - teammate handles)
```

## TODO List

### 🔐 Authentication (Priority: HIGH)
- [ ] Implement 42 OAuth strategy using Passport
  - Use `OAUTH_42_CLIENT_ID`, `OAUTH_42_CLIENT_SECRET`, `OAUTH_42_CALLBACK_URL` from .env
  - Create OAuth42Strategy extending PassportStrategy
  - Configure OAuth callback route at `/api/auth/42/callback`
- [ ] Auto-register users on first 42 OAuth login
  - Check if user exists by 42 intra ID
  - Create new user with 42 profile data if not exists
  - Store 42 intra ID in User model
- [ ] Generate and return JWT token after successful OAuth
  - Sign JWT with user payload (id, email, username)
  - Return token in response for frontend storage
- [ ] Add OAuth guard for `/api/auth/42` route
- [ ] Update Prisma schema to include `intraId` field for 42 users

### 💬 Chat System (Priority: HIGH)
- [ ] Create Chat module with WebSocket gateway
  - Use `@nestjs/platform-socket.io` for real-time messaging
  - Implement Socket.IO authentication middleware with JWT
- [ ] Create database schema for messages
  - Message model: id, senderId, receiverId, content, timestamp, isRead
  - Add relation to User model
- [ ] Implement chat features:
  - [ ] Send direct message to friend (1-on-1 chat)
  - [ ] Receive messages in real-time
  - [ ] Mark messages as read
  - [ ] Get chat history with a friend
  - [ ] Get list of conversations with unread count
- [ ] Chat endpoints:
  - `GET /api/chat/conversations` - List all conversations
  - `GET /api/chat/messages/:friendId` - Get messages with specific friend
  - `POST /api/chat/messages/:friendId` - Send message (fallback to REST)
  - `PATCH /api/chat/messages/:messageId/read` - Mark as read
- [ ] WebSocket events:
  - `message:send` - Send message to friend
  - `message:receive` - Receive message from friend
  - `message:read` - Notify sender message was read
  - `typing:start` - User is typing
  - `typing:stop` - User stopped typing

### 🎨 Frontend Integration (Priority: HIGH)
- [ ] Create OAuth login flow
  - Add "Login with 42" button that redirects to `/api/auth/42`
  - Handle OAuth callback and store JWT in localStorage/cookies
  - Add axios interceptor to include JWT in all requests
- [ ] Create Chat UI components
  - Chat list sidebar showing conversations
  - Chat window with message history
  - Message input with send button
  - Typing indicators
  - Unread message badges
  - Real-time updates via Socket.IO client
- [ ] Integrate Socket.IO client
  - Connect to WebSocket with JWT authentication
  - Listen for incoming messages
  - Emit typing indicators
  - Handle connection/disconnection events
- [ ] Add online status indicators for friends
- [ ] Add notification system for new messages

### 📝 Database Migrations
- [ ] Add migration for `intraId` field in User model
- [ ] Create Message model migration
- [ ] Create ChatRoom/Conversation model if needed

### 🧪 Testing
- [ ] Test 42 OAuth flow end-to-end
- [ ] Test JWT generation and validation
- [ ] Test WebSocket authentication
- [ ] Test message sending/receiving
- [ ] Test chat history retrieval

## References
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma + NestJS](https://docs.nestjs.com/recipes/prisma)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS OpenAPI/Swagger](https://docs.nestjs.com/openapi/introduction)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Passport 42 OAuth](http://www.passportjs.org/packages/passport-42/)
