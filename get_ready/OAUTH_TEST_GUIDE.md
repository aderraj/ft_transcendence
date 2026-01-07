# OAuth Login Test Instructions

## The Fix Applied ✅

**Problem:** After OAuth login, the JWT token was saved to localStorage but the UI didn't update.

**Solution:** Modified `AuthCallback.tsx` to use `window.location.href` instead of `navigate()` to force a full page reload, which reinitializes the auth state.

## How to Test OAuth Login

### Step 1: Open the Login Page
```
http://localhost:3000
```

### Step 2: Click "🚀 Login with 42" Button
- It's the blue/purple gradient button
- Located between the password login and test login

### Step 3: What Should Happen
1. **Redirects to:** 42 OAuth login page
2. **You login** with your 42 intra credentials
3. **Redirects back to:** `http://localhost:3000/auth/callback?token=eyJhbGc...`
4. **Shows:** "Authenticating with 42..." screen (with 🚀 rocket)
5. **Full page reload to:** `http://localhost:3000/dashboard`
6. **You're logged in!** ✅

### Step 4: Verify It Worked
- [ ] You should see the Dashboard page
- [ ] Your username should appear in the nav
- [ ] You can navigate to Profile, Users, Friends, etc.
- [ ] Token is stored in browser localStorage

## Check Browser Console

Open DevTools (F12) and look for:
```
OAuth token received: eyJhbGciOiJIUzI1NiIsIn...
```

## Check localStorage

In browser DevTools Console, run:
```javascript
localStorage.getItem('token')
```

Should return your JWT token.

## Troubleshooting

### If you see "Authenticating..." screen stuck:
1. Check browser console for errors
2. Make sure the callback URL in your 42 app settings matches:
   ```
   http://localhost:3001/api/auth/42/callback
   ```

### If redirected back to login page:
- Token might not be in the URL
- Check backend logs:
  ```bash
  sudo docker-compose logs -f backend
  ```

### If you don't have a 42 account:
Use the **"🧪 Test Login (Dev)"** button instead for instant access.

## Backend Logs

To see OAuth activity:
```bash
# Watch backend logs
sudo docker-compose logs -f backend

# Look for:
# - OAuth callback requests
# - User creation/login
# - JWT generation
```

## What Changed in the Code

### Before:
```tsx
// AuthCallback.tsx (OLD)
localStorage.setItem('token', token);
navigate('/dashboard', { replace: true });  // ❌ Doesn't reload auth state
```

### After:
```tsx
// AuthCallback.tsx (NEW)
localStorage.setItem('token', token);
window.location.href = '/dashboard';  // ✅ Full reload, auth state updates
```

## The Flow

```
1. Click "Login with 42"
   ↓
2. http://localhost:3001/api/auth/42
   ↓
3. 42 OAuth Login Page
   ↓
4. http://localhost:3001/api/auth/42/callback
   (Backend validates, creates user, generates JWT)
   ↓
5. Redirect: http://localhost:3000/auth/callback?token=<JWT>
   (Frontend AuthCallback component)
   ↓
6. Save token to localStorage
   ↓
7. window.location.href = '/dashboard'
   (Full page reload)
   ↓
8. App loads, reads token from localStorage
   ↓
9. Fetches user profile with token
   ↓
10. Dashboard renders ✅
```

## Expected Behavior

✅ **Success:** You're logged in and see the dashboard
✅ **Your user profile** is auto-created from 42 data
✅ **Username** from 42 intra (made unique if needed)
✅ **Token** valid for 7 days

## Test Without OAuth

If you can't test OAuth right now, use:
- **"🧪 Test Login (Dev)"** button - Creates test user instantly
- **Register** - Create local account with email/password

Both work the same way once logged in!

## Verify Everything Works

```bash
# Check all containers running
sudo docker ps

# Check backend is responding
curl http://localhost:3001/api/auth/42

# Should redirect to 42 or show HTML
```

## Summary

✅ OAuth button is visible on login page  
✅ AuthCallback component saves token  
✅ Full page reload ensures auth state updates  
✅ Auto-registration for new 42 users  
✅ JWT token stored and used for all requests  

**Try it now!** Open http://localhost:3000 and click "🚀 Login with 42"
