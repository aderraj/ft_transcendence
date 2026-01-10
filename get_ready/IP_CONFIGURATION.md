# IP Configuration Updated ✅

## Changed from localhost to 10.14.57.32

All services are now accessible via the IP address **10.14.57.32** instead of localhost.

## Updated URLs

### Frontend
- **OLD:** http://localhost:3000
- **NEW:** http://10.14.57.32:3000

### Backend API
- **OLD:** http://localhost:3001/api
- **NEW:** http://10.14.57.32:3001/api

### WebSocket Chat
- **OLD:** ws://localhost:3001/chat
- **NEW:** ws://10.14.57.32:3001/chat

### 42 OAuth Callback
- **OLD:** http://localhost:3001/api/auth/42/callback
- **NEW:** http://10.14.57.32:3001/api/auth/42/callback

## Files Updated

### 1. `.env`
```env
OAUTH_42_CALLBACK_URL=http://10.14.57.32:3001/api/auth/42/callback
FRONTEND_URL=http://10.14.57.32:3000
```

### 2. `frontend/src/App.tsx`
```tsx
// OAuth button now redirects to:
window.location.href = 'http://10.14.57.32:3001/api/auth/42'
```

### 3. `frontend/src/Chat.tsx`
```tsx
const API_URL = 'http://10.14.57.32:3001';
```

## ⚠️ Important: Update 42 OAuth Settings

You **MUST** update your 42 OAuth application settings:

1. Go to: https://profile.intra.42.fr/oauth/applications
2. Edit your application
3. Update the **Redirect URI** to:
   ```
   http://10.14.57.32:3001/api/auth/42/callback
   ```
4. Save changes

**Without this update, OAuth login will fail!**

## Access the Application

### Main URL
```
http://10.14.57.32:3000
```

### Swagger API Docs
```
http://10.14.57.32:3001/api
```

### Test Login
```bash
# Login with test user
curl -X POST http://10.14.57.32:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"reda","password":"password1"}'
```

## Test Users (Still Available)

| Username | Password  | Email                  |
|----------|-----------|------------------------|
| reda     | password1 | reda@transcendence.ma  |
| samir    | password2 | samir@transcendence.ma |
| aymen    | password3 | aymen@transcendence.ma |
| karim    | password4 | karim@transcendence.ma |
| user5    | password5 | user5@transcendence.ma |

## Services Status

```bash
# Check services
sudo docker ps

# Frontend: http://10.14.57.32:3000
# Backend:  http://10.14.57.32:3001/api
# Database: 10.14.57.32:5433
```

## Network Access

The application is now accessible from:
- ✅ Local machine: http://10.14.57.32:3000
- ✅ Other machines on same network: http://10.14.57.32:3000
- ✅ Mobile devices on same network: http://10.14.57.32:3000

## CORS Configuration

Backend CORS is configured to accept:
```
Origin: http://10.14.57.32:3000
```

## Firewall (if needed)

If you can't access from other devices, check firewall:

```bash
# Allow ports 3000 and 3001
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Or disable firewall temporarily for testing
sudo ufw disable
```

## Testing Checklist

- [ ] Access frontend: http://10.14.57.32:3000
- [ ] Login with test user (reda / password1)
- [ ] Test 42 OAuth (after updating callback URL)
- [ ] Test from another device on same network
- [ ] Check WebSocket chat connection
- [ ] Verify API calls work (check Network tab)

## Troubleshooting

### Cannot access from other devices
1. Check firewall settings
2. Verify IP is correct: `ip addr show`
3. Ensure devices are on same network

### OAuth login fails
1. Update 42 OAuth app redirect URI
2. Check backend logs: `sudo docker-compose logs backend`
3. Verify callback URL in .env matches 42 settings

### API calls fail
1. Check backend is running: `curl http://10.14.57.32:3001/api`
2. Verify CORS configuration in backend
3. Check frontend proxy in vite.config.ts

## Summary

✅ **IP Configuration:** Changed from localhost to 10.14.57.32  
✅ **Services Restarted:** Backend and Frontend updated  
✅ **OAuth Callback:** Updated to new IP  
✅ **CORS:** Configured for new IP  
✅ **Chat WebSocket:** Updated to new IP  

**Next Step:** Update your 42 OAuth application redirect URI!

**Access Now:** http://10.14.57.32:3000
