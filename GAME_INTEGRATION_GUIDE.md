# Game Integration Guide

## Overview
This document explains how the **Frontend** (`/front` or `/frontend`), **Backend** (`/backend`), and **Pong Game Server** (`/ft_transcendence-pong_game`) communicate to enable multiplayer Pong gameplay.

## System Architecture

```
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│                      │         │                      │         │                      │
│   Frontend (React)   │◄───────►│   Backend (NestJS)   │         │  Game Server (Node)  │
│   Port: 3000/3001    │  HTTP   │   Port: 3001         │         │  Port: 3002          │
│                      │  + WS   │                      │         │                      │
│  - User Interface    │         │  - Authentication    │         │  - Game Logic        │
│  - Game UI Render    │         │  - User Management   │         │  - Physics Engine    │
│  - Friend Invites    │◄────────┤  - Friend System     │         │  - Match Storage     │
│  - WebSocket Client  │   WS    │  - Stats/Leaderboard │         │  - WebSocket Server  │
│                      │         │                      │         │                      │
└──────────┬───────────┘         └──────────┬───────────┘         └──────────┬───────────┘
           │                                │                                │
           │                                │                                │
           └────────────────────────────────┴────────────────────────────────┘
                          All connected to PostgreSQL Database
                                    (Port: 5432)
```

## Component Responsibilities

### 1. Frontend (`/front` or `/frontend`)
- **Technology**: React/Vue with TypeScript
- **Port**: 3000 or 3001
- **Responsibilities**:
  - Render user interface
  - Handle user authentication
  - Display friend lists
  - Send game invitations
  - Connect to game server via WebSocket
  - Render game canvas (Pong paddles, ball, scores)
  - Send player input to game server
  - Display game results

### 2. Backend (`/backend`)
- **Technology**: NestJS with TypeScript
- **Port**: 3001
- **Database**: PostgreSQL (via Prisma ORM)
- **Responsibilities**:
  - User authentication (JWT, OAuth)
  - User management
  - Friend system (add/remove/list friends)
  - Store game history and statistics
  - Leaderboard calculations
  - User stats (wins, losses, level, XP)

### 3. Game Server (`/ft_transcendence-pong_game`)
- **Technology**: Fastify with WebSocket
- **Port**: 3002 (default PORT from env)
- **Database**: PostgreSQL (via Prisma)
- **Responsibilities**:
  - WebSocket connection management
  - Real-time game logic and physics
  - Matchmaking queue
  - Game state synchronization
  - Save match results to database
  - Update player statistics after games

---

## Communication Flows

### Flow 1: Friend Invitation to Play (Remote Game)

This is the complete flow when a user invites a friend to play:

```
┌──────────┐         ┌──────────┐         ┌──────────────┐
│ Frontend │         │ Backend  │         │  Game Server │
│ (User A) │         │          │         │              │
└────┬─────┘         └────┬─────┘         └──────┬───────┘
     │                    │                       │
     │ 1. Click "Invite   │                       │
     │    Friend to Play" │                       │
     │                    │                       │
     │ 2. HTTP POST       │                       │
     │ /api/friends/      │                       │
     │ invite-game        │                       │
     ├───────────────────►│                       │
     │                    │                       │
     │                    │ 3. Validate friendship│
     │                    │    (check DB)         │
     │                    │                       │
     │                    │ 4. Send notification  │
     │                    │    via WebSocket      │
     │                    │    (friends namespace)│
     │◄───────────────────┤                       │
     │ 5. Notification    │                       │
     │    sent to User B  │                       │
     │                    │                       │
┌────▼─────┐         ┌────┴─────┐         ┌──────┴───────┐
│ Frontend │         │ Backend  │         │  Game Server │
│ (User B) │         │          │         │              │
└────┬─────┘         └────┬─────┘         └──────┬───────┘
     │                    │                       │
     │ 6. Receive invite  │                       │
     │    notification    │                       │
     │◄───────────────────┤                       │
     │                    │                       │
     │ 7. Click "Accept"  │                       │
     │                    │                       │
     │ 8. HTTP POST       │                       │
     │ /api/friends/      │                       │
     │ accept-game        │                       │
     ├───────────────────►│                       │
     │                    │                       │
     │                    │ 9. Create game session│
     │                    │    (store in DB)      │
     │                    │                       │
     │ 10. Return game    │                       │
     │     URL & user IDs │                       │
     │◄───────────────────┤                       │
     │                    │                       │
     │ 11. Redirect both  │                       │
     │     users to game  │                       │
     │                    │                       │
     │ 12. Connect to     │                       │
     │     Game Server    │                       │
     │     WebSocket      │                       │
     ├────────────────────┼──────────────────────►│
     │                    │                       │
     │                    │                       │ 13. Add to matchmaking
     │                    │                       │     or create private lobby
     │                    │                       │
     │ 14. Game starts    │                       │
     │     when both      │                       │
     │     connected      │                       │
     │◄───────────────────┼───────────────────────┤
     │                    │                       │
```

---

## API Endpoints Reference

### Backend API (`http://localhost:3001/api`)

#### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/2fa/generate
POST /api/auth/2fa/verify
```

#### User Management
```
GET  /api/users/me
GET  /api/users/:id
PUT  /api/users/me
POST /api/users/me/avatar
```

#### Friends System
```
GET  /api/friends                    # Get all friends
GET  /api/friends/requests/pending   # Get incoming requests
GET  /api/friends/requests/sent      # Get sent requests
POST /api/friends/request/:userId    # Send friend request
POST /api/friends/request/:id/accept # Accept request
POST /api/friends/request/:id/decline # Decline request
DELETE /api/friends/:friendId        # Remove friend

# Game Invitations (NEW)
POST   /api/friends/invite-game              # Invite friend to play game
POST   /api/friends/accept-game              # Accept game invitation
DELETE /api/friends/game-invitation/:id      # Decline/cancel game invitation
GET    /api/friends/game-invitations/pending # Get pending game invitations
```

#### Leaderboard & Stats
```
GET /api/leaderboard                     # Get top players
GET /api/leaderboard/me                  # Get my stats
GET /api/leaderboard/me/history          # Get my game history
GET /api/leaderboard/user/:id/history    # Get user's game history
```

### Game Server API (`http://localhost:3002/api`)

#### Game Status & Info
```
GET /api/status          # Server status (players online, active games)
GET /api/games           # List active games
GET /api/queue           # Matchmaking queue status
GET /api/history         # Recent game history
GET /api/websocket-info  # WebSocket documentation
```

#### WebSocket Connection
```
WS  ws://localhost:3002/websocket?user_id=YOUR_USER_ID
```

---

## WebSocket Integration (Game Server)

### Connection Setup

#### Frontend Code Example:
```javascript
// Connect to Game Server WebSocket
const gameServerUrl = 'ws://localhost:3002/websocket';
const userId = localStorage.getItem('userId'); // Get from backend auth

const gameSocket = new WebSocket(`${gameServerUrl}?user_id=${userId}`);

gameSocket.onopen = () => {
  console.log('✅ Connected to game server');
};

gameSocket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleGameMessage(message);
};

gameSocket.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

gameSocket.onclose = () => {
  console.log('🔌 Disconnected from game server');
};
```

### WebSocket Events

#### Client → Server (Messages you send)

| Event | Format | Description |
|-------|--------|-------------|
| `moveUp` | String: `"moveUp"` | Move paddle up |
| `moveDown` | String: `"moveDown"` | Move paddle down |
| `onScore` | JSON: `{"type": "onScore", "side": "left"}` | Notify score event |
| `resetGameRound` | JSON: `{"type": "resetGameRound"}` | Reset ball position |
| `gameOver` | JSON: `{"type": "gameOver"}` | End the game |

#### Server → Client (Messages you receive)

| Event Type | JSON Structure | Description |
|------------|----------------|-------------|
| `game_start` | See below | Game started |
| `reset_game_round` | Score update | Ball reset after score |
| `key_move` | Paddle movement | Opponent paddle moved |
| `gameOver` | Final scores | Game ended |
| `player_left` | Disconnect info | Opponent disconnected |

---

## Message Formats (WebSocket)

### 1. Game Start Message
```json
{
  "type": "game_start",
  "random": 0.12345,
  "isLeft": true,
  "game": {
    "gameId": 42,
    "leftPlayer": {
      "userId": "user-123",
      "score": 0
    },
    "rightPlayer": {
      "userId": "user-456",
      "score": 0
    },
    "winner": null,
    "createdAt": 1768007133000
  }
}
```

**Field Explanations:**
- `isLeft`: Boolean indicating if you are the left player (`true`) or right player (`false`)
- `gameId`: Unique identifier for this game session
- `leftPlayer.userId` / `rightPlayer.userId`: Database user IDs
- `createdAt`: Timestamp when game started

### 2. Paddle Movement Message
```json
{
  "type": "key_move",
  "paddel": {
    "side": "left",
    "action": "up"
  },
  "timeStamp": 1768007140000
}
```

**Field Explanations:**
- `side`: Which paddle moved (`"left"` or `"right"`)
- `action`: Direction (`"up"` or `"down"`)

### 3. Score Update / Ball Reset
```json
{
  "type": "reset_game_round",
  "random": 0.67890,
  "timeStamp": 1768007145000,
  "isLeft": true,
  "players": {
    "leftPlayer": { "score": 1 },
    "rightPlayer": { "score": 0 }
  }
}
```

**Field Explanations:**
- `random`: Random number for synchronization
- `isLeft`: Your position (used for paddle placement)
- `players`: Current scores

### 4. Game Over Message
```json
{
  "type": "gameOver",
  "timeStamp": 1768007200000,
  "players": {
    "leftPlayer": { "score": 5 },
    "rightPlayer": { "score": 3 }
  }
}
```

### 5. Player Disconnected
```json
{
  "type": "player_left",
  "exited_paddel": "left"
}
```

---

## Frontend Implementation Guide

### Step 1: Authenticate with Backend

```javascript
// 1. Login to backend
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'player1', password: 'password' })
});

const { access_token, user } = await response.json();

// Store token and user ID
localStorage.setItem('token', access_token);
localStorage.setItem('userId', user.id);
```

### Step 2: Get Friends List

```javascript
const friendsResponse = await fetch('http://localhost:3001/api/friends', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const friends = await friendsResponse.json();
```

### Step 3: Invite Friend to Play (Via Backend)

This endpoint is now **IMPLEMENTED** in the backend!

```javascript
// Send invitation through backend
async function inviteFriendToPlay(friendId) {
  const response = await fetch(`http://localhost:3001/api/friends/invite-game`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      friendId: friendId,
      gameMode: 'remote' // or 'local'
    })
  });
  
  const data = await response.json();
  // Returns: { invitationId, gameMode, inviter, invitee, createdAt, expiresAt }
  return data;
}
```

**Friend receives WebSocket notification:**
```javascript
// In friend's browser (must be connected to /friends WebSocket namespace)
socket.on('friend:game_invitation_received', (data) => {
  console.log('Game invitation from:', data.inviterDisplayName);
  // data includes: invitationId, inviterId, inviterUsername, inviterDisplayName, gameMode, timestamp
  
  // Show UI notification
  showGameInvitationNotification(data);
});
```

**Accept the invitation:**
```javascript
async function acceptGameInvitation(invitationId) {
  const response = await fetch(`http://localhost:3001/api/friends/accept-game`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      invitationId: invitationId
    })
  });
  
  const data = await response.json();
  // Returns game session details
  console.log('Game session:', data.gameSession);
  
  // Connect to game server
  const gameSocket = new WebSocket(
    `${data.gameSession.gameServerUrl}?user_id=${data.gameSession.connectionParams.user_id}&room=${data.gameSession.connectionParams.room}`
  );
  
  return data;
}
```

**WebSocket Events for Game Invitations:**

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `friend:game_invitation_received` | Server → Client | `{ invitationId, inviterId, inviterUsername, inviterDisplayName, gameMode, timestamp }` | You received a game invitation |
| `friend:game_invitation_accepted` | Server → Client | `{ invitationId, acceptedByUserId, gameMode, timestamp }` | Your invitation was accepted |
| `friend:game_invitation_declined` | Server → Client | `{ invitationId, declinedByUserId, timestamp }` | Your invitation was declined |

### Step 4: Connect to Game Server (Direct WebSocket)

```javascript
function connectToGameServer(userId, isPrivateGame = false, roomId = null) {
  let wsUrl = `ws://localhost:3002/websocket?user_id=${userId}`;
  
  // For private games (friend invites)
  if (isPrivateGame && roomId) {
    wsUrl += `&room=${roomId}`;
  }
  
  const gameSocket = new WebSocket(wsUrl);
  
  gameSocket.onopen = () => {
    console.log('🎮 Connected to game server');
  };
  
  gameSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'game_start':
        handleGameStart(data);
        break;
      case 'key_move':
        handlePaddleMove(data);
        break;
      case 'reset_game_round':
        handleScoreUpdate(data);
        break;
      case 'gameOver':
        handleGameOver(data);
        break;
      case 'player_left':
        handlePlayerLeft(data);
        break;
    }
  };
  
  return gameSocket;
}
```

### Step 5: Implement Game Rendering

```javascript
// Game state
let gameState = {
  isLeft: false,
  gameId: null,
  leftPlayer: { userId: null, score: 0, paddleY: 50 },
  rightPlayer: { userId: null, score: 0, paddleY: 50 },
  ball: { x: 50, y: 50 }
};

function handleGameStart(data) {
  gameState.isLeft = data.isLeft;
  gameState.gameId = data.game.gameId;
  gameState.leftPlayer = { ...data.game.leftPlayer, paddleY: 50 };
  gameState.rightPlayer = { ...data.game.rightPlayer, paddleY: 50 };
  gameState.ball = { x: 50, y: 50 };
  
  console.log(`🎮 Game started! You are ${data.isLeft ? 'LEFT' : 'RIGHT'} player`);
  
  // Start rendering game
  startGameLoop();
}

function handlePaddleMove(data) {
  const { side, action } = data.paddel;
  
  // Update paddle position based on movement
  if (side === 'left') {
    if (action === 'up') {
      gameState.leftPlayer.paddleY = Math.max(0, gameState.leftPlayer.paddleY - 5);
    } else if (action === 'down') {
      gameState.leftPlayer.paddleY = Math.min(100, gameState.leftPlayer.paddleY + 5);
    }
  } else if (side === 'right') {
    if (action === 'up') {
      gameState.rightPlayer.paddleY = Math.max(0, gameState.rightPlayer.paddleY - 5);
    } else if (action === 'down') {
      gameState.rightPlayer.paddleY = Math.min(100, gameState.rightPlayer.paddleY + 5);
    }
  }
  
  // Re-render will happen in game loop
}

function handleScoreUpdate(data) {
  gameState.leftPlayer.score = data.players.leftPlayer.score;
  gameState.rightPlayer.score = data.players.rightPlayer.score;
  
  // Reset ball to center
  gameState.ball = { x: 50, y: 50 };
  
  console.log(`📊 Score: ${gameState.leftPlayer.score} - ${gameState.rightPlayer.score}`);
}

function handleGameOver(data) {
  console.log('🏆 Game Over!');
  console.log(`Final Score: ${data.players.leftPlayer.score} - ${data.players.rightPlayer.score}`);
  
  // Show game over screen
  showGameOverScreen(data);
  
  // Close connection
  gameSocket.close();
}

function handlePlayerLeft(data) {
  alert(`Opponent disconnected! (${data.exited_paddel} player left)`);
  gameSocket.close();
}
```

### Step 6: Handle User Input

```javascript
let keysPressed = new Set();

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    if (!keysPressed.has('up')) {
      keysPressed.add('up');
      gameSocket.send('moveUp');
    }
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    if (!keysPressed.has('down')) {
      keysPressed.add('down');
      gameSocket.send('moveDown');
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    keysPressed.delete('up');
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    keysPressed.delete('down');
  }
});
```

### Step 7: Render Game on Canvas

```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function renderGame() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw center line
  ctx.strokeStyle = '#fff';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw left paddle
  const leftPaddleY = (gameState.leftPlayer.paddleY / 100) * canvas.height;
  ctx.fillStyle = '#0ff';
  ctx.fillRect(20, leftPaddleY - 40, 10, 80);
  
  // Draw right paddle
  const rightPaddleY = (gameState.rightPlayer.paddleY / 100) * canvas.height;
  ctx.fillStyle = '#f0f';
  ctx.fillRect(canvas.width - 30, rightPaddleY - 40, 10, 80);
  
  // Draw ball
  const ballX = (gameState.ball.x / 100) * canvas.width;
  const ballY = (gameState.ball.y / 100) * canvas.height;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw scores
  ctx.font = '48px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(gameState.leftPlayer.score, canvas.width / 4, 60);
  ctx.fillText(gameState.rightPlayer.score, (3 * canvas.width) / 4, 60);
}

function startGameLoop() {
  setInterval(() => {
    renderGame();
  }, 1000 / 60); // 60 FPS
}
```

---

## Local Game Mode

For local games (2 players on same device):

```javascript
function startLocalGame() {
  const userId = `local-${Date.now()}`;
  const gameSocket = new WebSocket(`ws://localhost:3002/websocket?user_id=${userId}&mode=local`);
  
  // Similar setup but handle both paddles locally
  document.addEventListener('keydown', (e) => {
    // Player 1 (W/S)
    if (e.key === 'w' || e.key === 'W') {
      gameSocket.send('moveUp'); // Sends as left paddle
    } else if (e.key === 's' || e.key === 'S') {
      gameSocket.send('moveDown');
    }
    
    // Player 2 (Arrow Keys) - would need separate connection or protocol
    // This requires modification to game server to support local mode
  });
}
```

**Note**: Current game server implementation expects 2 separate WebSocket connections. For true local multiplayer on one device, you would need to modify the game server to handle dual input from a single connection.

---

## Complete Integration Example (React Component)

```jsx
import React, { useEffect, useState, useRef } from 'react';

function PongGame({ userId, opponentId = null }) {
  const [gameSocket, setGameSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Connect to game server
    let wsUrl = `ws://localhost:3002/websocket?user_id=${userId}`;
    if (opponentId) {
      wsUrl += `&opponent=${opponentId}`;
    }
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🎮 Connected to game server');
      setConnectionStatus('connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'game_start') {
        setGameState({
          isLeft: data.isLeft,
          gameId: data.game.gameId,
          leftPlayer: { ...data.game.leftPlayer, paddleY: 50 },
          rightPlayer: { ...data.game.rightPlayer, paddleY: 50 },
          ball: { x: 50, y: 50 }
        });
      } else if (data.type === 'key_move') {
        setGameState(prev => {
          const newState = { ...prev };
          const { side, action } = data.paddel;
          const delta = action === 'up' ? -5 : 5;
          
          if (side === 'left') {
            newState.leftPlayer.paddleY = Math.max(0, Math.min(100, prev.leftPlayer.paddleY + delta));
          } else {
            newState.rightPlayer.paddleY = Math.max(0, Math.min(100, prev.rightPlayer.paddleY + delta));
          }
          
          return newState;
        });
      } else if (data.type === 'reset_game_round') {
        setGameState(prev => ({
          ...prev,
          leftPlayer: { ...prev.leftPlayer, score: data.players.leftPlayer.score },
          rightPlayer: { ...prev.rightPlayer, score: data.players.rightPlayer.score },
          ball: { x: 50, y: 50 }
        }));
      } else if (data.type === 'gameOver') {
        alert('Game Over!');
        setConnectionStatus('finished');
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    ws.onclose = () => {
      console.log('🔌 Disconnected');
      setConnectionStatus('disconnected');
    };
    
    setGameSocket(ws);
    
    return () => {
      if (ws) ws.close();
    };
  }, [userId, opponentId]);
  
  // Handle keyboard input
  useEffect(() => {
    if (!gameSocket || connectionStatus !== 'connected') return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        gameSocket.send('moveUp');
      } else if (e.key === 'ArrowDown') {
        gameSocket.send('moveDown');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameSocket, connectionStatus]);
  
  // Render game
  useEffect(() => {
    if (!gameState || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Center line
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Paddles
      const leftY = (gameState.leftPlayer.paddleY / 100) * canvas.height;
      ctx.fillStyle = '#0ff';
      ctx.fillRect(20, leftY - 40, 10, 80);
      
      const rightY = (gameState.rightPlayer.paddleY / 100) * canvas.height;
      ctx.fillStyle = '#f0f';
      ctx.fillRect(canvas.width - 30, rightY - 40, 10, 80);
      
      // Ball
      const ballX = (gameState.ball.x / 100) * canvas.width;
      const ballY = (gameState.ball.y / 100) * canvas.height;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Scores
      ctx.font = '48px Arial';
      ctx.fillText(gameState.leftPlayer.score, canvas.width / 4, 60);
      ctx.fillText(gameState.rightPlayer.score, (3 * canvas.width) / 4, 60);
    };
    
    const interval = setInterval(render, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameState]);
  
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🎮 Pong Game</h1>
      <p>Status: {connectionStatus}</p>
      {gameState && (
        <p>You are the {gameState.isLeft ? 'LEFT (Cyan)' : 'RIGHT (Magenta)'} player</p>
      )}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600}
        style={{ border: '2px solid #fff', background: '#000' }}
      />
      <p>Controls: Arrow Up/Down</p>
    </div>
  );
}

export default PongGame;
```

---

## Database Schema (PostgreSQL)

The game server and backend share the same PostgreSQL database:

```prisma
// Game match record
model Match {
  id          String   @id @default(uuid())
  user1Id     String   // Left player
  user2Id     String   // Right player
  user1Score  Int      @default(0)
  user2Score  Int      @default(0)
  winnerId    String?  // null for draws
  status      String   @default("IN_PROGRESS") // IN_PROGRESS, FINISHED, FORFEITED
  createdAt   DateTime @default(now())
  endedAt     DateTime?
  
  user1       User     @relation("User1Matches", fields: [user1Id], references: [id])
  user2       User     @relation("User2Matches", fields: [user2Id], references: [id])
}

// User stats (updated after each game)
model User {
  id              String   @id @default(uuid())
  username        String   @unique
  wins            Int      @default(0)
  losses          Int      @default(0)
  experience      Int      @default(0)
  level           Int      @default(1)
  // ... other user fields
}
```

---

## Environment Configuration

### Backend `.env`
```env
DATABASE_URL=postgresql://transcendence:transcendence@postgres:5432/transcendence
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Game Server `.env`
```env
DATABASE_URL=postgresql://transcendence:transcendence@postgres:5432/transcendence
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Docker Compose Ports
```yaml
services:
  backend:
    ports:
      - "3001:3001"  # Backend API
  
  game-server:
    ports:
      - "3002:3002"  # Game Server (WebSocket + REST)
  
  postgres:
    ports:
      - "5433:5432"  # PostgreSQL (external:internal)
```

---

## Testing the Integration

### 1. Test Backend Connection
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Game Server Status
```bash
curl http://localhost:3002/api/status
```

### 3. Test WebSocket Connection
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3002/websocket?user_id=test-user-123');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

### 4. Test Matchmaking
```javascript
// Open two browser tabs
// Tab 1:
const ws1 = new WebSocket('ws://localhost:3002/websocket?user_id=player1');

// Tab 2:
const ws2 = new WebSocket('ws://localhost:3002/websocket?user_id=player2');

// Game should start automatically when both connect
```

---

## Troubleshooting

### Issue: "Failed to connect to game server"
- **Check**: Game server is running on port 3002
- **Solution**: `docker compose up game-server` or `npm start` in `/ft_transcendence-pong_game`

### Issue: "WebSocket connection failed"
- **Check**: CORS settings in game server
- **Solution**: Add frontend URL to `ALLOWED_ORIGINS` in game server `.env`

### Issue: "Game doesn't start"
- **Check**: Both players connected to WebSocket
- **Check**: Browser console for errors
- **Check**: Game server logs for matchmaking status

### Issue: "Scores not saving to database"
- **Check**: Database connection in game server
- **Check**: Prisma client is generated (`npx prisma generate`)
- **Check**: Database migrations are applied (`npx prisma migrate deploy`)

---

## Next Steps & Enhancements

1. **Add Backend Game API**: Create endpoints in backend to manage game invitations
2. **Improve Matchmaking**: Add ELO-based matching
3. **Add Spectator Mode**: Allow users to watch ongoing games
4. **Add Game Rooms**: Private rooms with custom settings
5. **Add Tournament Mode**: Bracket-style tournaments
6. **Add Replay System**: Save and replay games
7. **Add Power-ups**: Special abilities during gameplay
8. **Mobile Support**: Touch controls for mobile devices

---

## Summary

This integration connects three main components:

1. **Frontend** → Authenticates users, displays UI, renders game
2. **Backend** → Manages users, friends, authentication, stats
3. **Game Server** → Handles real-time gameplay, physics, matchmaking

**Key Integration Points:**
- Frontend authenticates with Backend (JWT)
- Frontend connects to Game Server (WebSocket)
- Game Server saves results to shared PostgreSQL database
- Backend reads game history from database for leaderboards

The system is designed to be modular - each component can be developed and deployed independently while sharing the same database.
