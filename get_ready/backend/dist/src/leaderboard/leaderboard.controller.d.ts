import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getLeaderboard(take?: number, skip?: number): Promise<{
        players: {
            avatar: string;
            totalGames: number;
            winRate: number;
            id: string;
            username: string;
            displayName: string;
            wins: number;
            losses: number;
            level: number;
            experience: number;
            rank: number;
        }[];
        total: number;
        take: number;
        skip: number;
    }>;
    getMyStats(user: any): Promise<{
        avatar: string;
        totalGames: number;
        winRate: number;
        id: string;
        username: string;
        displayName: string;
        wins: number;
        losses: number;
        level: number;
        experience: number;
        rank: number;
    }>;
    getTopWinners(): Promise<{
        avatar: string;
        id: string;
        username: string;
        displayName: string;
        wins: number;
        losses: number;
        level: number;
        experience: number;
    }[]>;
    getUserStats(userId: string): Promise<{
        avatar: string;
        totalGames: number;
        winRate: number;
        id: string;
        username: string;
        displayName: string;
        wins: number;
        losses: number;
        level: number;
        experience: number;
        rank: number;
    }>;
    getUserHistory(userId: string, take?: number): Promise<{
        player1: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        player2: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        id: string;
        player1Score: number;
        player2Score: number;
        winnerId: string;
        finishedAt: Date;
        player1Id: string;
        player2Id: string;
    }[]>;
    getMyHistory(user: any, take?: number): Promise<{
        player1: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        player2: {
            avatar: string;
            id: string;
            username: string;
            displayName: string;
        };
        id: string;
        player1Score: number;
        player2Score: number;
        winnerId: string;
        finishedAt: Date;
        player1Id: string;
        player2Id: string;
    }[]>;
}
//# sourceMappingURL=leaderboard.controller.d.ts.map