# Pong Game

A real-time multiplayer Pong game with WebSocket support and match history tracking.

## Tech Stack

- **Backend**: Fastify + WebSocket
- **Database**: PostgreSQL with Prisma ORM (v7)
- **Frontend**: Vanilla JavaScript with Canvas API
- **Styling**: TailwindCSS

## Prerequisites

- Node.js v20+
- Docker (for PostgreSQL)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker run --name pong-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pong -p 5433:5432 -d postgres:15
```

### 3. Configure environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pong"
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

## Running the Game

```bash
npm start
```

The server starts at `http://localhost:3000`

## Database Schema

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | String | Unique username |

### Match
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user1Id | UUID | Left player reference |
| user2Id | UUID | Right player reference |
| user1Score | Int | Left player score |
| user2Score | Int | Right player score |
| winnerId | UUID | Winner reference (null if draw) |
| createdAt | DateTime | Match start time |
| endedAt | DateTime | Match end time |

## Development

### Watch TailwindCSS changes

```bash
npm run watch
```

### View database

```bash
npx prisma studio
```

## Game Features

- Real-time multiplayer via WebSocket
- Automatic matchmaking queue
- Match result persistence
- Forfeit handling (disconnected player loses)
