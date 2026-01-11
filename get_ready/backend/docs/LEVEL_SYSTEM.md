# Level System Documentation 🎮

## Overview
The Transcendence game uses a **level-based progression system** instead of ELO rating. Players earn experience points (XP) by playing games and level up as they gain more experience.

## System Design

### Experience Points (XP)
- **Win a game**: +100 XP
- **Lose a game**: +10 XP
- Every game contributes to player progression

### Level Calculation
- **Formula**: `Level = floor(Experience / 1000) + 1`
- **XP per level**: 1000 XP
- Players start at **Level 1** with **0 XP**

### Example Progression
| Games Played | Wins | Losses | Total XP | Level |
|--------------|------|--------|----------|-------|
| 0            | 0    | 0      | 0        | 1     |
| 5            | 3    | 2      | 320      | 1     |
| 10           | 7    | 3      | 730      | 1     |
| 15           | 10   | 5      | 1050     | 2     |
| 20           | 12   | 8      | 1280     | 2     |
| 50           | 30   | 20     | 3200     | 4     |
| 100          | 65   | 35     | 6850     | 7     |

## Level Tiers 🏆

Players are grouped into tiers based on their level:

| Tier      | Level Range | Description                    |
|-----------|-------------|--------------------------------|
| 🥉 Bronze | 1-4         | Beginners                      |
| 🥈 Silver | 5-9         | Getting comfortable            |
| 🥇 Gold   | 10-19       | Experienced players            |
| 💎 Platinum | 20-29     | Advanced players               |
| 💠 Diamond | 30-39      | Elite players                  |
| 👑 Master | 40-49       | Top-tier competitors           |
| ⭐ Legend | 50+         | Legendary status               |

## Leaderboard Ranking

Players are ranked based on:
1. **Primary**: Level (higher level = higher rank)
2. **Secondary**: Experience points (tiebreaker for same level)

Example leaderboard:
```
Rank | Username | Level | XP    | Wins | Losses
-----|----------|-------|-------|------|-------
1    | reda     | 1     | 730   | 7    | 3
2    | karim    | 1     | 660   | 6    | 6
3    | samir    | 1     | 550   | 5    | 5
4    | user5    | 1     | 550   | 5    | 5
5    | aymen    | 1     | 440   | 4    | 4
```

## Database Schema

```prisma
model User {
  // ... other fields
  
  wins        Int  @default(0)
  losses      Int  @default(0)
  level       Int  @default(1)
  experience  Int  @default(0)
  
  // ... relations
}
```

## API Response Format

### GET `/api/leaderboard`
```json
{
  "players": [
    {
      "rank": 1,
      "id": "uuid",
      "username": "reda",
      "displayName": "Reda",
      "avatar": "avatar.jpg",
      "level": 1,
      "experience": 730,
      "wins": 7,
      "losses": 3,
      "totalGames": 10,
      "winRate": 70
    }
  ],
  "total": 5,
  "take": 50,
  "skip": 0
}
```

### GET `/api/leaderboard/me`
```json
{
  "rank": 1,
  "id": "uuid",
  "username": "reda",
  "displayName": "Reda",
  "avatar": "avatar.jpg",
  "level": 1,
  "experience": 730,
  "wins": 7,
  "losses": 3,
  "totalGames": 10,
  "winRate": 70
}
```

## Implementation Guide

### After Game Completion

When a game finishes, update the winner and loser:

```typescript
import { awardExperience } from '../common/utils/level.utils';

// Winner gains 100 XP
const winnerUpdate = awardExperience(winner.experience, true);
await prisma.user.update({
  where: { id: winnerId },
  data: {
    wins: { increment: 1 },
    experience: winnerUpdate.newExperience,
    level: winnerUpdate.newLevel,
  },
});

// Loser gains 10 XP
const loserUpdate = awardExperience(loser.experience, false);
await prisma.user.update({
  where: { id: loserId },
  data: {
    losses: { increment: 1 },
    experience: loserUpdate.newExperience,
    level: loserUpdate.newLevel,
  },
});

// Notify if leveled up
if (winnerUpdate.leveledUp) {
  // Send notification: "🎉 Level Up! You are now level X"
}
if (loserUpdate.leveledUp) {
  // Send notification: "🎉 Level Up! You are now level X"
}
```

### Utility Functions

```typescript
import {
  calculateLevel,
  experienceToNextLevel,
  levelProgress,
  getLevelTier,
} from '../common/utils/level.utils';

// Get current level from XP
const level = calculateLevel(1250); // Returns: 2

// Get XP needed for next level
const xpNeeded = experienceToNextLevel(1250); // Returns: 750

// Get progress percentage in current level
const progress = levelProgress(1250); // Returns: 25 (25%)

// Get tier name
const tier = getLevelTier(15); // Returns: "Gold"
```

## Migration from ELO

The migration automatically converts existing ELO values:

```sql
-- Level = 1 + (total_games / 5)
-- Experience = (wins * 100) + (losses * 10)
UPDATE "users" 
SET 
  "level" = 1 + ((wins + losses) / 5),
  "experience" = (wins * 100) + (losses * 10);
```

## Benefits of Level System

1. **More Intuitive**: Players easily understand "Level 10" vs "1250 ELO"
2. **Always Progressing**: Even losses grant XP, keeping players motivated
3. **Clear Milestones**: Level-ups provide clear achievement moments
4. **Tier System**: Players can identify with tier names (Bronze, Silver, Gold, etc.)
5. **No Negative Progress**: Unlike ELO, players never go down in level
6. **Simpler Math**: Easy to calculate and understand

## Frontend Display Ideas

### Player Card
```
┌─────────────────────────┐
│ 👤 Reda                 │
│ ⭐ Level 3 - Bronze     │
│ 📊 850 / 1000 XP (85%)  │
│ ━━━━━━━━━━━━━━━░░░      │
│ 🎮 10 Games (7W / 3L)   │
│ 📈 Win Rate: 70%        │
└─────────────────────────┘
```

### Level Up Notification
```
╔═══════════════════════════╗
║   🎉 LEVEL UP! 🎉         ║
║                           ║
║   You are now Level 4!    ║
║   Keep playing to reach   ║
║   Silver tier (Level 5)   ║
╚═══════════════════════════╝
```

## Future Enhancements

1. **Seasonal Resets**: Reset levels each season with rewards
2. **Level Rewards**: Unlock avatars, titles at certain levels
3. **XP Bonuses**: Daily first win bonus, win streaks
4. **Challenges**: Special missions for bonus XP
5. **Prestige System**: Reset to Level 1 with special badge after Level 100
