/**
 * Level System Utils
 * 
 * Experience and Level calculation for the game
 * 
 * Formula:
 * - Win: +100 XP
 * - Loss: +10 XP
 * - Level up every 1000 XP
 * - Level = floor(experience / 1000) + 1
 */

export const XP_PER_WIN = 100;
export const XP_PER_LOSS = 10;
export const XP_PER_LEVEL = 1000;

/**
 * Calculate level based on experience
 */
export function calculateLevel(experience: number): number {
  return Math.floor(experience / XP_PER_LEVEL) + 1;
}

/**
 * Calculate experience needed for next level
 */
export function experienceToNextLevel(experience: number): number {
  const currentLevel = calculateLevel(experience);
  const nextLevelXP = currentLevel * XP_PER_LEVEL;
  return nextLevelXP - experience;
}

/**
 * Calculate experience progress in current level (0-100%)
 */
export function levelProgress(experience: number): number {
  const xpInCurrentLevel = experience % XP_PER_LEVEL;
  return Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
}

/**
 * Award experience and calculate new level
 */
export function awardExperience(
  currentExperience: number,
  isWin: boolean
): { newExperience: number; newLevel: number; leveledUp: boolean } {
  const xpGained = isWin ? XP_PER_WIN : XP_PER_LOSS;
  const newExperience = currentExperience + xpGained;
  
  const oldLevel = calculateLevel(currentExperience);
  const newLevel = calculateLevel(newExperience);
  const leveledUp = newLevel > oldLevel;

  return {
    newExperience,
    newLevel,
    leveledUp,
  };
}

/**
 * Get level tier name
 */
export function getLevelTier(level: number): string {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Diamond';
  if (level >= 20) return 'Platinum';
  if (level >= 10) return 'Gold';
  if (level >= 5) return 'Silver';
  return 'Bronze';
}
