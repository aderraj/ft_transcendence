# Test Users Created ✅

## Database Seeded Successfully!

The following test users have been created in your database:

## 👥 Test Users

### User 1: Reda
- **Email:** reda@transcendence.ma
- **Username:** reda
- **Password:** password1
- **ELO:** 1200
- **Stats:** 7 wins, 3 losses
- **Friends:** samir (accepted)

### User 2: Samir  
- **Email:** samir@transcendence.ma
- **Username:** samir
- **Password:** password2
- **ELO:** 1100
- **Stats:** 5 wins, 5 losses
- **Friends:** reda (accepted)

### User 3: Aymen
- **Email:** aymen@transcendence.ma
- **Username:** aymen
- **Password:** password3
- **ELO:** 1050
- **Stats:** 4 wins, 4 losses
- **Friend Requests:** Sent to karim (pending)

### User 4: Karim
- **Email:** karim@transcendence.ma
- **Username:** karim
- **Password:** password4
- **ELO:** 1000
- **Stats:** 6 wins, 6 losses
- **Friend Requests:** From aymen (pending)
- **Friends:** user5 (accepted)

### User 5: User5
- **Email:** user5@transcendence.ma
- **Username:** user5
- **Password:** password5
- **ELO:** 950
- **Stats:** 5 wins, 5 losses
- **Friends:** karim (accepted)

## 🎮 Game Data
- ✅ 10 game records created
- ✅ Various win/loss scenarios

## 👫 Friendships Created
- ✅ reda ↔ samir (accepted)
- ✅ karim ↔ user5 (accepted)
- ⏳ aymen → karim (pending request)

## 🧪 How to Test

### Test Login
```bash
# Open http://localhost:3000
# Login with any test user:

Username: reda
Password: password1

# OR

Username: samir  
Password: password2

# etc.
```

### Test Features

#### 1. Friends System
- Login as **aymen**
- Check pending friend requests
- Login as **karim** 
- Accept aymen's request

#### 2. Chat System
- Login as **reda**
- Chat with **samir** (they're friends)
- Real-time messaging should work

#### 3. Leaderboard
- View all users ranked by ELO
- reda (1200) should be #1
- user5 (950) should be last

#### 4. User Profiles
- View each user's profile
- See win/loss stats
- Check game history

## 🔄 Reset Database

If you want to reset and reseed:
```bash
# Reset database
sudo docker exec -it transcendence-backend npx prisma migrate reset --skip-seed

# Seed again
sudo docker exec -it transcendence-backend npm run seed
```

## 📊 Quick Stats

| Username | Password  | ELO  | W/L | Friends |
|----------|-----------|------|-----|---------|
| reda     | password1 | 1200 | 7/3 | samir   |
| samir    | password2 | 1100 | 5/5 | reda    |
| aymen    | password3 | 1050 | 4/4 | -       |
| karim    | password4 | 1000 | 6/6 | user5   |
| user5    | password5 | 950  | 5/5 | karim   |

## 🎯 Test Scenarios

### Scenario 1: Existing Friendship
1. Login as **reda** (password1)
2. Go to Friends page
3. Should see **samir** as friend
4. Try chatting with samir

### Scenario 2: Pending Friend Request
1. Login as **karim** (password4)
2. Go to Friends page
3. Should see pending request from **aymen**
4. Accept or decline request

### Scenario 3: Add New Friend
1. Login as **aymen** (password3)
2. Go to Users page
3. Find **reda** or **samir**
4. Send friend request
5. Login as that user to accept

### Scenario 4: Leaderboard
1. Login with any user
2. Go to Leaderboard page
3. See users ranked by ELO
4. View detailed stats

## ✅ Everything Ready!

Your database now has:
- ✅ 5 test users with passwords
- ✅ 2 established friendships
- ✅ 1 pending friend request
- ✅ 10 game records
- ✅ Varied ELO ratings

**Start testing:** http://localhost:3000

Login with any username above and corresponding password!
