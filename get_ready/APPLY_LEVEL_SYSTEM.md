# Applying Level System Changes 🚀

## Steps to Apply

### 1. Run the migration
```bash
# From host machine
sudo docker exec -it transcendence-backend npx prisma migrate deploy

# This will:
# - Rename `elo` column to `level`
# - Add `experience` column
# - Convert existing data (level = 1 + games/5, xp = wins*100 + losses*50)
```

### 2. Generate Prisma Client
```bash
sudo docker exec -it transcendence-backend npx prisma generate
```

### 3. Restart Backend Container
```bash
sudo docker-compose restart backend
```

### 4. Reseed Database (Optional - Fresh Start)
```bash
# Reset and reseed with new level system
sudo docker exec -it transcendence-backend npx prisma migrate reset

# Seed with test users
sudo docker exec -it transcendence-backend npm run seed
```

## Verification

### Check Database Schema
```bash
sudo docker exec -it transcendence-db psql -U transcendence -d transcendence -c "\d users"
```

Should show:
```
 level       | integer | not null default 1
 experience  | integer | not null default 0
```

### Test API
```bash
# Get leaderboard (should show level and experience)
curl http://localhost:3001/api/leaderboard

# Expected response:
{
  "players": [
    {
      "rank": 1,
      "username": "karim",
      "level": 3,
      "experience": 900,
      "wins": 6,
      "losses": 6,
      "totalGames": 12,
      "winRate": 50
    },
    ...
  ]
}
```

## Changes Summary

### Database
- ✅ `users.elo` → `users.level`
- ✅ Added `users.experience`
- ✅ Migration converts existing data

### Backend Code
- ✅ `leaderboard.service.ts` - Sort by level & experience
- ✅ `seed.ts` - Use level/experience instead of elo
- ✅ Added `level.utils.ts` - Helper functions for XP calculations
- ✅ `auth.service.ts` - 2FA security fixes included

### Documentation
- ✅ `LEVEL_SYSTEM.md` - Complete system documentation
- ✅ `TEST_USERS.md` - Updated with level/XP values

## Level System Formula

### Experience Gain
- **Win**: +100 XP
- **Loss**: +50 XP

### Level Calculation
```typescript
Level = floor(Experience / 1000) + 1
```

### Example
- 0 XP = Level 1
- 850 XP = Level 1 (85% to Level 2)
- 1000 XP = Level 2
- 2500 XP = Level 3
- 10000 XP = Level 11

## Troubleshooting

### Migration fails
```bash
# Check migration status
sudo docker exec -it transcendence-backend npx prisma migrate status

# Force reset if needed
sudo docker exec -it transcendence-backend npx prisma migrate reset --force
```

### Backend won't start
```bash
# Check logs
sudo docker logs transcendence-backend

# Regenerate Prisma client
sudo docker exec -it transcendence-backend npx prisma generate

# Restart
sudo docker-compose restart backend
```

### Old ELO values still showing
```bash
# Clear browser cache or hard refresh (Ctrl+Shift+R)
# Restart frontend
sudo docker-compose restart frontend
```

## Next Steps (Optional)

### Update Frontend
Update frontend components to display:
- Level badge/icon
- XP progress bar
- "Level Up!" notifications
- Tier badges (Bronze, Silver, Gold, etc.)

### Add Level-Up Logic
When game finishes, award XP and check for level up:
```typescript
import { awardExperience } from './common/utils/level.utils';

const result = awardExperience(user.experience, isWin);
if (result.leveledUp) {
  // Send notification
  // Award achievement
}
```
