# Game Invitation API - Implementation Summary

## ✅ What Was Implemented

### 1. **Backend API Endpoints** (`/backend/src/friends/`)

#### New Controller Endpoints (`friends.controller.ts`)
- `POST /api/friends/invite-game` - Invite friend to play game
- `POST /api/friends/accept-game` - Accept game invitation
- `DELETE /api/friends/game-invitation/:id` - Decline/cancel invitation
- `GET /api/friends/game-invitations/pending` - Get all pending invitations

#### New Service Methods (`friends.service.ts`)
- `inviteFriendToGame()` - Create game invitation with 5-minute expiration
- `acceptGameInvitation()` - Accept invitation and generate game session details
- `declineGameInvitation()` - Decline or cancel invitation
- `getPendingGameInvitations()` - Get received and sent invitations

#### New WebSocket Gateway Methods (`friends.gateway.ts`)
- `notifyGameInvitation()` - Real-time notification to invitee
- `notifyGameInvitationAccepted()` - Notify inviter of acceptance
- `notifyGameInvitationDeclined()` - Notify about declination

### 2. **Database Schema** (`/backend/prisma/schema.prisma`)

#### New Model: `GameInvitation`
```prisma
model GameInvitation {
  id         String   @id @default(uuid())
  inviterId  String
  inviteeId  String
  gameMode   String   @default("remote") // "remote" or "local"
  status     GameInvitationStatus @default(PENDING)
  expiresAt  DateTime // Expires after 5 minutes
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  inviter    User     @relation("SentGameInvitations", ...)
  invitee    User     @relation("ReceivedGameInvitations", ...)
}

enum GameInvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

### 3. **DTOs** (`/backend/src/friends/dto/game-invitation.dto.ts`)

#### GameInvitationDto
```typescript
{
  friendId: string;      // Required
  gameMode?: GameMode;   // Optional, defaults to 'remote'
}
```

#### AcceptGameInvitationDto
```typescript
{
  invitationId: string;  // Required
}
```

### 4. **Documentation**

- Updated `GAME_INTEGRATION_GUIDE.md` with:
  - Complete API endpoint reference
  - WebSocket event documentation
  - Frontend integration examples
  - Request/response formats

---

## 📋 Required Steps to Use

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_game_invitations
npx prisma generate
```

### Step 2: Restart Backend

```bash
docker compose restart backend
# OR
cd backend && npm run start:dev
```

### Step 3: Test the Endpoints

#### Send Game Invitation
```bash
curl -X POST http://localhost:3001/api/friends/invite-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "friendId": "FRIEND_USER_ID",
    "gameMode": "remote"
  }'
```

#### Get Pending Invitations
```bash
curl http://localhost:3001/api/friends/game-invitations/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Accept Invitation
```bash
curl -X POST http://localhost:3001/api/friends/accept-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "invitationId": "INVITATION_ID"
  }'
```

---

## 🔄 Complete Flow

### 1. User A Invites User B

```javascript
// Frontend (User A)
const invite = await fetch('/api/friends/invite-game', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    friendId: 'user-b-id',
    gameMode: 'remote'
  })
});

// Response:
{
  "invitationId": "inv-123",
  "gameMode": "remote",
  "inviter": { "id": "user-a-id", "username": "PlayerA", ... },
  "invitee": { "id": "user-b-id", "username": "PlayerB", ... },
  "createdAt": "2026-01-12T10:00:00Z",
  "expiresAt": "2026-01-12T10:05:00Z"
}
```

### 2. User B Receives WebSocket Notification

```javascript
// Frontend (User B) - WebSocket listener
socket.on('friend:game_invitation_received', (data) => {
  // data = {
  //   invitationId: "inv-123",
  //   inviterId: "user-a-id",
  //   inviterUsername: "PlayerA",
  //   inviterDisplayName: "Player A",
  //   gameMode: "remote",
  //   timestamp: "2026-01-12T10:00:00Z"
  // }
  
  showNotification(`${data.inviterDisplayName} wants to play!`);
});
```

### 3. User B Accepts Invitation

```javascript
// Frontend (User B)
const response = await fetch('/api/friends/accept-game', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    invitationId: 'inv-123'
  })
});

// Response:
{
  "message": "Game invitation accepted",
  "gameSession": {
    "invitationId": "inv-123",
    "gameMode": "remote",
    "player1Id": "user-a-id",
    "player1Username": "PlayerA",
    "player2Id": "user-b-id",
    "player2Username": "PlayerB",
    "gameServerUrl": "ws://localhost:3002/websocket",
    "roomId": "game-user-a-id-user-b-id-1737543600000",
    "connectionParams": {
      "user_id": "user-b-id",
      "room": "game-user-a-id-user-b-id-1737543600000",
      "mode": "remote"
    }
  }
}
```

### 4. User A Receives Acceptance Notification

```javascript
// Frontend (User A) - WebSocket listener
socket.on('friend:game_invitation_accepted', (data) => {
  // data = {
  //   invitationId: "inv-123",
  //   acceptedByUserId: "user-b-id",
  //   gameMode: "remote",
  //   timestamp: "2026-01-12T10:00:30Z"
  // }
  
  // Redirect to game page
  window.location.href = '/game';
});
```

### 5. Both Users Connect to Game Server

```javascript
// Both User A and User B
const gameSocket = new WebSocket(
  `ws://localhost:3002/websocket?user_id=${userId}&room=${roomId}`
);

gameSocket.onopen = () => {
  console.log('Connected to game server!');
};

gameSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'game_start') {
    console.log('Game starting!', data.game);
  }
};
```

---

## 📝 Swagger Documentation

All endpoints are documented with Swagger decorators:
- Access Swagger UI: `http://localhost:3001/api` (Swagger docs page)
- Tag: `friends`
- Bearer Auth required for all endpoints

### Example Swagger Response Schema

**POST /api/friends/invite-game**
```json
{
  "invitationId": "550e8400-e29b-41d4-a716-446655440002",
  "gameMode": "remote",
  "inviter": {
    "id": "user-a-id",
    "username": "PlayerA",
    "displayName": "Player A"
  },
  "invitee": {
    "id": "user-b-id",
    "username": "PlayerB",
    "displayName": "Player B"
  },
  "createdAt": "2026-01-12T10:00:00.000Z",
  "expiresAt": "2026-01-12T10:05:00.000Z"
}
```

---

## 🎯 Features

✅ **Friend Validation**: Only friends can invite each other  
✅ **Expiration**: Invitations expire after 5 minutes  
✅ **Duplicate Prevention**: Can't send multiple pending invitations to same user  
✅ **Real-time Notifications**: WebSocket events for all parties  
✅ **Bidirectional**: Both inviter and invitee are notified  
✅ **Auto-cleanup**: Expired invitations are automatically deleted  
✅ **Game Modes**: Supports "remote" and "local" modes  
✅ **Room Generation**: Unique room IDs for private games  
✅ **Full Swagger Docs**: Complete API documentation

---

## 🔧 Environment Variables

Add to `/backend/.env` (optional):

```env
GAME_SERVER_URL=ws://localhost:3002/websocket
```

If not set, defaults to `ws://localhost:3002/websocket`.

---

## 🧪 Testing

### Manual Testing

1. **Create two users** (User A and User B)
2. **Add them as friends**
3. **Connect User B to WebSocket** (`/friends` namespace)
4. **User A sends invitation**
5. **User B receives notification** (check WebSocket events)
6. **User B accepts invitation**
7. **User A receives acceptance** (check WebSocket events)
8. **Both connect to game server** with provided `gameServerUrl` and `roomId`

### Automated Testing (TODO)

```typescript
// backend/src/friends/friends.controller.spec.ts
describe('Game Invitations', () => {
  it('should invite friend to game', async () => { /* ... */ });
  it('should accept game invitation', async () => { /* ... */ });
  it('should decline game invitation', async () => { /* ... */ });
  it('should not invite non-friend', async () => { /* ... */ });
  it('should handle expired invitations', async () => { /* ... */ });
});
```

---

## 📚 Related Files

- **Controller**: `/backend/src/friends/friends.controller.ts` (lines 126-311)
- **Service**: `/backend/src/friends/friends.service.ts` (lines 313-554)
- **Gateway**: `/backend/src/friends/friends.gateway.ts` (lines 232-321)
- **DTOs**: `/backend/src/friends/dto/game-invitation.dto.ts`
- **Schema**: `/backend/prisma/schema.prisma` (lines 106-131)
- **Documentation**: `/GAME_INTEGRATION_GUIDE.md`

---

## 🚀 Next Steps

1. **Run migrations**: `npx prisma migrate dev --name add_game_invitations`
2. **Test endpoints**: Use Swagger UI or curl
3. **Integrate frontend**: Connect WebSocket and use API
4. **Connect to game server**: Use provided WebSocket URL and room ID

---

## ⚠️ Known Limitations

- Invitations expire after 5 minutes (hardcoded)
- No notification system for offline users (WebSocket only)
- Game server URL is configured via environment variable
- Local game mode requires special handling (both players on same device)

---

## 💡 Future Enhancements

- [ ] Email notifications for offline users
- [ ] Invitation history (keep declined/expired invitations)
- [ ] Configurable expiration time
- [ ] Tournament/group game invitations
- [ ] Spectator mode invitations
- [ ] Rematch functionality
- [ ] Game invitation cancellation by inviter before acceptance
