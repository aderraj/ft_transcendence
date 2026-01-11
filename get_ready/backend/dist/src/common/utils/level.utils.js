"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_PER_LEVEL = exports.XP_PER_LOSS = exports.XP_PER_WIN = void 0;
exports.calculateLevel = calculateLevel;
exports.experienceToNextLevel = experienceToNextLevel;
exports.levelProgress = levelProgress;
exports.awardExperience = awardExperience;
exports.getLevelTier = getLevelTier;
exports.XP_PER_WIN = 100;
exports.XP_PER_LOSS = 10;
exports.XP_PER_LEVEL = 1000;
function calculateLevel(experience) {
    return Math.floor(experience / exports.XP_PER_LEVEL) + 1;
}
function experienceToNextLevel(experience) {
    const currentLevel = calculateLevel(experience);
    const nextLevelXP = currentLevel * exports.XP_PER_LEVEL;
    return nextLevelXP - experience;
}
function levelProgress(experience) {
    const xpInCurrentLevel = experience % exports.XP_PER_LEVEL;
    return Math.round((xpInCurrentLevel / exports.XP_PER_LEVEL) * 100);
}
function awardExperience(currentExperience, isWin) {
    const xpGained = isWin ? exports.XP_PER_WIN : exports.XP_PER_LOSS;
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
function getLevelTier(level) {
    if (level >= 50)
        return 'Legend';
    if (level >= 40)
        return 'Master';
    if (level >= 30)
        return 'Diamond';
    if (level >= 20)
        return 'Platinum';
    if (level >= 10)
        return 'Gold';
    if (level >= 5)
        return 'Silver';
    return 'Bronze';
}
//# sourceMappingURL=level.utils.js.map