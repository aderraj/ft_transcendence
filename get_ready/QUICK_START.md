# Quick Start Guide - OAuth & Chat

## 🔐 42 OAuth Login

### For Frontend Developers:
Add this button to your login page:

```tsx
<button onClick={() => window.location.href = 'http://localhost:3001/api/auth/42'}>
  Login with 42
</button>
```

### What Happens:
1. User clicks button → Redirects to 42 OAuth
2. User authorizes → 42 redirects back to backend
3. Backend creates/finds user → Generates JWT token
4. Backend redirects to: `http://localhost:3000/auth/callback?token=<JWT>`
5. Frontend `AuthCallback` component saves token and redirects to dashboard

### Using the AuthCallback Component:
```tsx
// In App.tsx, add this route:
<Route path="/auth/callback" element={<AuthCallback />} />
```

## 💬 Chat System

### Using the Chat Component:
```tsx
import { Chat } from './Chat';

function Dashboard() {
  const { user, token } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <Chat token={token} currentUserId={user.id} />
    </div>
  );
}
```

### Chat Features:
- ✅ Real-time messaging
- ✅ Online/offline status
- ✅ Typing indicators
- ✅ Read receipts (✓✓)
- ✅ Unread message count
- ✅ Friend-only messaging

### WebSocket Connection:
The Chat component automatically connects to `ws://localhost:3001/chat` using your JWT token.

## 🧪 Testing

### Test OAuth Flow:
```bash
# 1. Open browser
http://localhost:3001/api/auth/42

# 2. Login with your 42 credentials

# 3. You'll be redirected with a token:
http://localhost:3000/auth/callback?token=eyJhbGc...
```

### Test Chat (after having friends):
1. Login with two different accounts
2. Add each other as friends
3. Open Chat component
4. Send messages in real-time!

### Test via Swagger:
```bash
# Open Swagger UI
http://localhost:3001/api

# Test endpoints:
- POST /api/auth/register (create test users)
- POST /api/friends/request/:userId (send friend request)
- POST /api/friends/request/:requestId/accept
- GET /api/chat/conversations
- GET /api/chat/messages/:friendId
```

## 🔑 API Endpoints

### OAuth
- `GET /api/auth/42` - Initiate 42 OAuth
- `GET /api/auth/42/callback` - OAuth callback (auto-handled)

### Chat (REST)
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/messages/:friendId` - Get messages with friend
- `POST /api/chat/messages/:friendId` - Send message
- `PATCH /api/chat/messages/:messageId/read` - Mark as read
- `PATCH /api/chat/messages/:friendId/read-all` - Mark all as read

### Chat (WebSocket)
Connect to: `ws://localhost:3001/chat`

**Send:**
- `message:send` → `{ receiverId, content }`
- `typing:start` → `{ receiverId }`
- `typing:stop` → `{ receiverId }`
- `message:read` → `{ messageId }`

**Receive:**
- `message:receive` → Full message object
- `message:sent` → Confirmation
- `typing:start` → `{ userId }`
- `typing:stop` → `{ userId }`
- `friend:status` → `{ userId, isOnline }`
- `message:read` → `{ messageId }`

## 🎨 Customization

### Styling the Chat Component:
The Chat component uses inline styles. You can:
1. Extract styles to CSS modules
2. Use Tailwind CSS
3. Use styled-components
4. Customize colors, spacing, etc.

### Adding Notifications:
```tsx
useEffect(() => {
  socket?.on('message:receive', (message) => {
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('New Message', {
        body: message.content,
        icon: message.sender.avatar
      });
    }
  });
}, [socket]);
```

## 🐛 Troubleshooting

### OAuth Redirect Issues:
- Check `.env` file has correct `OAUTH_42_CALLBACK_URL`
- Verify 42 app settings match callback URL
- Check browser console for errors

### Chat Connection Issues:
```bash
# Check backend logs
sudo docker-compose logs -f backend

# Common issues:
- JWT token not being sent
- Token expired (generate new one)
- WebSocket blocked by firewall
```

### Database Issues:
```bash
# Check migrations
sudo docker exec -it transcendence-backend npx prisma migrate status

# View data
sudo docker exec -it transcendence-backend npx prisma studio
# Opens at http://localhost:5555
```

## 📖 Resources
- **Swagger API Docs:** http://localhost:3001/api
- **Prisma Studio:** http://localhost:5555 (run command above)
- **Backend Logs:** `sudo docker-compose logs -f backend`
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/api
