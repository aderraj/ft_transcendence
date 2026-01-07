# Transcendence Backend Setup Guide

## Quick Start

### 1. Install Dependencies

Inside the Docker container or locally:

```bash
yarn install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Required configurations:**

```env
# Database (default values work with docker-compose)
DATABASE_URL="postgresql://transcendence:your_password@postgres:5432/transcendence?schema=public"
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=change_this_secure_password
POSTGRES_DB=transcendence

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key
JWT_EXPIRATION=7d

# 42 OAuth (see setup below)
OAUTH_42_CLIENT_ID=your_42_app_uid
OAUTH_42_CLIENT_SECRET=your_42_app_secret
OAUTH_42_CALLBACK_URL=http://localhost:3001/api/auth/42/callback
```

### 3. Setup 42 OAuth Application

1. Go to https://profile.intra.42.fr/oauth/applications/new
2. Fill in the form:
   - **Name**: Transcendence (or any name)
   - **Redirect URI**: `http://localhost:3001/api/auth/42/callback`
3. Click "Submit"
4. Copy the **UID** → paste as `OAUTH_42_CLIENT_ID` in `.env`
5. Copy the **SECRET** → paste as `OAUTH_42_CLIENT_SECRET` in `.env`

### 4. Start the Application

Using Docker (recommended):

```bash
# Start all services
make up

# Or rebuild after dependency changes
make build
```

Using Yarn (local development):

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start in watch mode
yarn start:dev
```

### 5. Access the Application

- **API**: http://localhost:3001/api
- **Swagger Documentation**: http://localhost:3001/api
- **Database (Prisma Studio)**: `npx prisma studio`

## Testing the Setup

### Test Authentication

#### 1. Register a new user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "username": "test"
  }
}
```

#### 2. Login:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 3. Test 42 OAuth:

Open in browser:
```
http://localhost:3001/api/auth/42
```

This will redirect to 42 intranet login, then back to your app with a JWT token.

### Test WebSocket Chat

Use a WebSocket client or create a simple test:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/chat', {
  query: { userId: 'your-user-id' }
});

// Send message to friend
socket.emit('sendMessage', {
  toId: 'friend-user-id',
  content: 'Hello!'
});

// Listen for incoming messages
socket.on('messageReceived', (data) => {
  console.log('New message:', data);
});

// Ping/pong for connection health
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Pong received:', data);
});
```

## Development Workflow

### Database Changes

After modifying `prisma/schema.prisma`:

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
```

### Generate New Resources

```bash
# Full CRUD resource
nest g resource <name>

# Individual components
nest g module <name>
nest g service <name>
nest g controller <name>
```

### Docker Commands

```bash
# Start services
make up

# Rebuild after code changes
make build

# Clean restart (removes volumes)
make re

# View logs
make logs

# Stop services
make down

# Clean everything
make fclean
```

## API Documentation

Once the app is running, visit http://localhost:3001/api for interactive Swagger documentation.

### Available Endpoints

**Authentication:**
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/42` - Redirect to 42 OAuth
- `GET /api/auth/42/callback` - 42 OAuth callback

**WebSocket (Chat):**
- Namespace: `/chat`
- Events: `sendMessage`, `messageReceived`, `userOnline`, `userOffline`, `ping`, `pong`

## Troubleshooting

### Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database connection issues

```bash
# Check if PostgreSQL is running
sudo docker ps | grep postgres

# Access PostgreSQL
sudo docker exec -it postgres-db psql -U transcendence

# Reset database
make clean
make up
```

### OAuth not working

1. Verify `.env` has correct `OAUTH_42_CLIENT_ID` and `OAUTH_42_CLIENT_SECRET`
2. Check callback URL in 42 app matches: `http://localhost:3001/api/auth/42/callback`
3. Ensure 42 app has "public" scope enabled

### Dependencies not found

```bash
# Inside Docker container
yarn install
npx prisma generate

# Or rebuild Docker image
make build
```

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── strategies/         # JWT & 42 OAuth strategies
│   ├── guards/             # Auth guards (JWT, 42)
│   ├── decorators/         # Custom decorators (@Public, @GetUser)
│   └── dto/                # Data transfer objects
├── chat/                   # WebSocket chat gateway
├── user/                   # User management
├── friends/                # Friend system
├── prisma/                 # Database service
└── main.ts                 # App bootstrap with Swagger
```

## Next Steps

1. ✅ Auth system with JWT and 42 OAuth
2. ✅ Simple WebSocket chat
3. ✅ Swagger documentation
4. 🚧 Implement user profile endpoints
5. 🚧 Implement friends system endpoints
6. 🚧 Build game module with matchmaking
7. 🚧 Add leaderboard functionality
