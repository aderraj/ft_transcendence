export declare const XP_PER_WIN = 100;
export declare const XP_PER_LOSS = 10;
export declare const XP_PER_LEVEL = 1000;
export declare function calculateLevel(experience: number): number;
export declare function experienceToNextLevel(experience: number): number;
export declare function levelProgress(experience: number): number;
export declare function awardExperience(currentExperience: number, isWin: boolean): {
    newExperience: number;
    newLevel: number;
    leveledUp: boolean;
};
export declare function getLevelTier(level: number): string;
//# sourceMappingURL=level.utils.d.ts.map