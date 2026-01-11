import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class LeaderboardService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getAvatarUrl;
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
    getGameHistory(userId: string, take?: number): Promise<{
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
    getTopByWins(take?: number): Promise<{
        avatar: string;
        id: string;
        username: string;
        displayName: string;
        wins: number;
        losses: number;
        level: number;
        experience: number;
    }[]>;
}
//# sourceMappingURL=leaderboard.service.d.ts.map