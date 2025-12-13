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
export class PrismaService extends PrismaClient {
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

## References
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma + NestJS](https://docs.nestjs.com/recipes/prisma)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS OpenAPI/Swagger](https://docs.nestjs.com/openapi/introduction)
