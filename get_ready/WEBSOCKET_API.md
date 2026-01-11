# WebSocket API Documentation

This backend exposes two WebSocket namespaces using Socket.io:
1. `/friends` - For user online/offline status, friend requests, and game invitations.
2. `/chat` - For messaging.

## Connection
All connections require JWT authentication.
- **Protocol:** `ws` or `wss`
- **Transport:** Polling / Websocket

#### Client connection example (using `socket.io-client`):
```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-backend-url/friends', { // or /chat
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

---

## Namespace: `/friends`
**Purpose**: Real-time user presence updates, friend requests, and game invitations.

### Server -> Client Events (Listen for these)

#### `friend:status`
Triggered when a friend comes online or goes offline.
- **Payload**:
  ```json
  {
    "userId": "uuid-string",
    "isOnline": true
  }
  ```

#### `friend:request_received`
Triggered when you receive a new friend request.
- **Payload**:
  ```json
  {
    "requestId": "uuid-string",
    "senderId": "uuid-string",
    "senderUsername": "username",
    "senderDisplayName": "Display Name"
  }
  ```

#### `friend:request_accepted`
Triggered when your friend request is accepted (sent to both users).
- **Payload**:
  ```json
  {
    "userId": "uuid-string",
    "username": "username",
    "displayName": "Display Name"
  }
  ```

#### `friend:game_invite_received`
Triggered when a friend invites you to a game.
- **Payload**:
  ```json
  {
    "senderId": "uuid-string",
    "senderUsername": "username",
    "senderDisplayName": "Display Name"
  }
  ```

#### `friend:game_start`
Triggered when both players accept a game invite. Provides the room ID to connect to the game server.
- **Payload**:
  ```json
  {
    "roomId": "game_1234567890_abc123",
    "opponentId": "uuid-string"
  }
  ```

#### `friend:game_invite_declined`
Triggered when a friend declines your game invite.
- **Payload**:
  ```json
  {
    "userId": "uuid-string"
  }
  ```

### Client -> Server Events (Emit these)

#### `friend:accept_request`
Accept a friend request.
- **Emit**:
  ```json
  {
    "requestId": "uuid-string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Friend request accepted"
  }
  ```

#### `friend:invite_game`
Invite a friend to play a game.
- **Emit**:
  ```json
  {
    "friendId": "uuid-string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Game invite sent"
  }
  ```

#### `friend:respond_game_invite`
Respond to a game invitation (accept or decline).
- **Emit**:
  ```json
  {
    "senderId": "uuid-string",
    "accepted": true
  }
  ```
- **Response (if accepted)**:
  ```json
  {
    "success": true,
    "roomId": "game_1234567890_abc123"
  }
  ```
- **Response (if declined)**:
  ```json
  {
    "success": true,
    "message": "Game invite declined"
  }
  ```

---

## Namespace: `/chat`
**Purpose**: Direct messaging.

### Client -> Server Events (Emit these)

#### `message:send`
Send a direct message to another user.
- **Payload**:
  ```json
  {
    "receiverId": "uuid-string",
    "content": "Hello world"
  }
  ```
- **Response** (Ack): Message object or `{ error: string }`

#### `message:read`
Mark a message as read.
- **Payload**:
  ```json
  {
    "messageId": "uuid-string"
  }
  ```

#### `typing:start`
Indicate user is typing.
- **Payload**:
  ```json
  {
    "receiverId": "uuid-string"
  }
  ```

#### `typing:stop`
Indicate user stopped typing.
- **Payload**:
  ```json
  {
    "receiverId": "uuid-string"
  }
  ```

### Server -> Client Events (Listen for these)

#### `message:receive`
Received when someone sends you a message.
- **Payload**: `Message` object

#### `message:sent`
Confirmation that your message was processed.
- **Payload**: `Message` object

#### `message:read`
Received when the recipient reads your message.
- **Payload**:
  ```json
  {
    "messageId": "uuid-string"
  }
  ```

#### `typing:start` / `typing:stop`
Received when a chat partner starts/stops typing.
- **Payload**:
  ```json
  {
    "userId": "uuid-string"
  }
  ```

---

## Deprecated Events (Chat Namespace)

The following events are deprecated and have been moved to the `/friends` namespace. They may still work but will be removed in a future version:

- `invite_game` → Use `friend:invite_game` in `/friends` namespace
- `respond_invite` → Use `friend:respond_game_invite` in `/friends` namespace
- `receive_invite` → Listen for `friend:game_invite_received` in `/friends` namespace
- `game_start` → Listen for `friend:game_start` in `/friends` namespace
- `invite_declined` → Listen for `friend:game_invite_declined` in `/friends` namespace

---# Friends WebSocket Features - Implementation Summary

## Overview
Added comprehensive WebSocket support for friend requests and game invitations to the `/friends` namespace.

## New WebSocket Events

### 1. Friend Request Notifications

#### Backend → Client: `friend:request_received`
- **Trigger**: Automatically sent when a user receives a friend request
- **Payload**:
  ```json
  {
    "senderId": "uuid",
    "senderUsername": "username",
    "senderDisplayName": "Display Name"
  }
  ```
- **Implementation**: 
  - `FriendsGateway.notifyFriendRequest()` method
  - Called from `FriendsController.sendFriendRequest()` after successful request creation

### 2. Accept Friend Request via WebSocket

#### Client → Backend: `friend:accept_request`
- **Emit**:
  ```json
  {
    "requestId": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Friend request accepted"
  }
  ```
- **Side Effects**: Triggers `friend:request_accepted` event to both users

#### Backend → Client: `friend:request_accepted`
- **Trigger**: Sent to both users when a friend request is accepted
- **Payload**:
  ```json
  {
    "userId": "uuid",
    "username": "username",
    "displayName": "Display Name"
  }
  ```

### 3. Game Invitations (Moved from Chat)

#### Client → Backend: `friend:invite_game`
- **Emit**:
  ```json
  {
    "friendId": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Game invite sent"
  }
  ```

#### Backend → Client: `friend:game_invite_received`
- **Trigger**: Sent when a friend invites you to play
- **Payload**:
  ```json
  {
    "senderId": "uuid",
    "senderUsername": "username",
    "senderDisplayName": "Display Name"
  }
  ```

#### Client → Backend: `friend:respond_game_invite`
- **Emit**:
  ```json
  {
    "senderId": "uuid",
    "accepted": true
  }
  ```
- **Response (accepted)**:
  ```json
  {
    "success": true,
    "roomId": "game_1234567890_abc123"
  }
  ```
- **Response (declined)**:
  ```json
  {
    "success": true,
    "message": "Game invite declined"
  }
  ```

#### Backend → Client: `friend:game_start`
- **Trigger**: Sent to both players when invite is accepted
- **Payload**:
  ```json
  {
    "roomId": "game_1234567890_abc123",
    "opponentId": "uuid"
  }
  ```
- **Action**: Frontend should redirect both players to the game page with this room ID

#### Backend → Client: `friend:game_invite_declined`
- **Trigger**: Sent to inviter when recipient declines
- **Payload**:
  ```json
  {
    "userId": "uuid"
  }
  ```

## Files Modified

### backend/src/friends/friends.gateway.ts
- Added imports: `SubscribeMessage`, `MessageBody`, `ConnectedSocket`
- Added method: `notifyFriendRequest()` - Sends notification when friend request is received
- Added handler: `handleAcceptFriendRequest()` - Accept friend request via WebSocket
- Added handler: `handleGameInvite()` - Send game invitation
- Added handler: `handleGameInviteResponse()` - Accept/decline game invitation

### backend/src/friends/friends.controller.ts
- Injected `FriendsGateway` into constructor
- Modified `sendFriendRequest()` to call `gateway.notifyFriendRequest()` after creating request

### backend/src/friends/friends.service.ts
- Updated `sendFriendRequest()` to include both `sender` and `receiver` data in response

### WEBSOCKET_API.md
- Added comprehensive documentation for all new events
- Marked old chat-based game invite events as deprecated
- Provided migration path from chat to friends namespace

## Connection Example

```javascript
import { io } from 'socket.io-client';

const friendsSocket = io('https://your-backend-url/friends', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for friend request
friendsSocket.on('friend:request_received', (data) => {
  console.log(`Friend request from ${data.senderDisplayName}`);
  // Show notification in UI
});

// Accept friend request
friendsSocket.emit('friend:accept_request', { requestId: 'uuid' }, (response) => {
  if (response.success) {
    console.log('Friend request accepted!');
  }
});

// Listen for acceptance confirmation
friendsSocket.on('friend:request_accepted', (data) => {
  console.log(`Now friends with ${data.displayName}`);
  // Update UI to show new friend
});

// Invite to game
friendsSocket.emit('friend:invite_game', { friendId: 'uuid' }, (response) => {
  if (response.success) {
    console.log('Game invite sent!');
  }
});

// Listen for game invite
friendsSocket.on('friend:game_invite_received', (data) => {
  console.log(`Game invite from ${data.senderDisplayName}`);
  // Show game invite modal
});

// Respond to game invite
friendsSocket.emit('friend:respond_game_invite', {
  senderId: 'uuid',
  accepted: true
}, (response) => {
  if (response.success && response.roomId) {
    console.log(`Game starting in room: ${response.roomId}`);
    // Redirect to game
  }
});

// Listen for game start
friendsSocket.on('friend:game_start', (data) => {
  console.log(`Game starting! Room: ${data.roomId}, Opponent: ${data.opponentId}`);
  window.location.href = `/game/${data.roomId}`;
});
```

## Frontend Integration Checklist

- [ ] Connect to `/friends` WebSocket namespace on login
- [ ] Listen for `friend:request_received` and show notification
- [ ] Implement UI to accept friend requests via `friend:accept_request` event
- [ ] Listen for `friend:request_accepted` and update friends list
- [ ] Add "Invite to Game" button that emits `friend:invite_game`
- [ ] Listen for `friend:game_invite_received` and show game invite modal
- [ ] Implement accept/decline buttons that emit `friend:respond_game_invite`
- [ ] Listen for `friend:game_start` and redirect to game page
- [ ] Listen for `friend:game_invite_declined` and show notification
- [ ] Update existing code to use friends namespace instead of chat for game invites

## Benefits

1. **Better Organization**: Friend-related features are now in the friends namespace
2. **Real-time Notifications**: Users are instantly notified of friend requests
3. **WebSocket Accept**: Friend requests can be accepted via WebSocket without HTTP requests
4. **Game Invites**: Seamless game invitation flow with proper notifications
5. **Consistent API**: All friend features use consistent event naming with `friend:` prefix

## Migration Notes

The old game invite events in the `/chat` namespace (`invite_game`, `respond_invite`, etc.) are still available but marked as deprecated. Frontend should migrate to using the `/friends` namespace events for game invitations.

## Testing

To test the new WebSocket events:

1. **Friend Request Flow**:
   - User A sends friend request to User B via REST API
   - User B should receive `friend:request_received` event
   - User B emits `friend:accept_request`
   - Both users receive `friend:request_accepted` event

2. **Game Invite Flow**:
   - User A emits `friend:invite_game` with User B's ID
   - User B receives `friend:game_invite_received` event
   - User B emits `friend:respond_game_invite` with `accepted: true`
   - Both users receive `friend:game_start` with roomId
   - Frontend redirects both users to game page

3. **Decline Flow**:
   - User A emits `friend:invite_game` with User B's ID
   - User B receives `friend:game_invite_received` event
   - User B emits `friend:respond_game_invite` with `accepted: false`
   - User A receives `friend:game_invite_declined` event
